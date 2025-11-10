import json
import random
import time
import threading
from confluent_kafka import Producer  # 注意：这里应为Producer而非KafkaProducer
from typing import Dict, Any, List
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('kafka_producer')


class DeviceSimulator:
    """模拟物流设备生成数据"""

    def __init__(self,
                 bootstrap_servers: List[str],
                 num_devices: int = 10,
                 partitions_per_topic: int = 8,
                 sleep_interval: float = 1.0):
        """初始化设备模拟器"""
        self.num_devices = num_devices
        self.partitions_per_topic = partitions_per_topic
        self.sleep_interval = sleep_interval
        # 1. 固定映射：设备 D0000→车辆 V100, D0001→V101, …
        self.device_to_vehicle = {
            f"D{i:04d}": f"V{100 + i}"
            for i in range(num_devices)
        }
        # 2. 初始化每台设备的起始坐标（假设一条“南北走向”的道路，纬度不断增加）
        #    起始经度固定 120.0，起始纬度从 30.0 + i*0.01
        self.locations = {
            device_id: {
                "latitude": 30.0 + i * 0.01,
                "longitude": 120.0
            }
            for i, device_id in enumerate(self.device_to_vehicle)
        }

        # 修正：confluent-kafka的配置方式与kafka-python不同
        self.producer = Producer({
            'bootstrap.servers': ','.join(bootstrap_servers),
            'client.id': 'logistics-simulator',
            'retries': 3,
            'linger.ms': 50,
            'batch.size': 16384,
            'acks': 'all',
            'api.version.request': True  # 明确请求版本兼容
        })
        self.running = False
        self.threads = []

    def _device_id_to_partition(self, device_id: str) -> int:
        """根据设备ID计算分区号"""
        return hash(device_id) % self.partitions_per_topic

    def _generate_logistics_data(self, device_id: str) -> Dict[str, Any]:
        """生成物流数据"""
        return {
            "device_id": device_id,
            "package_id": f"P{random.randint(100000, 999999)}",
            "temperature": round(random.uniform(-20.0, 30.0), 2),
            "humidity": random.randint(0, 100),
            "status": random.choice(["in_transit", "delivered", "delayed", "picked_up"]),
            "timestamp": time.time()
        }

    def _generate_alert_data(self, device_id: str) -> Dict[str, Any]:
        """生成告警数据"""
        alert_types = ["temperature_high", "temperature_low", "humidity_high",
                       "shock_detected", "power_outage", "tampering"]
        return {
            "device_id": device_id,
            "alert_type": random.choice(alert_types),
            "severity": random.choice(["low", "medium", "high"]),
            "timestamp": time.time(),
            "details": f"Alert triggered by device {device_id}"
        }

    def _generate_vehicle_location(self, device_id: str) -> Dict[str, Any]:
        """生成车辆位置数据：按小步长前进，确保正值且连续"""
        loc = self.locations[device_id]
        # 每次在原有基础上前进 0.001 度纬度，保持经度不变或小幅波动
        new_lat = loc["latitude"] + random.uniform(0.0005, 0.0015)
        new_lon = loc["longitude"] + random.uniform(-0.0005, 0.0005)
        # 更新状态回存
        loc["latitude"], loc["longitude"] = new_lat, new_lon
        # 随机选择status（无状态转移逻辑）
        status_options = [
            "in_transit",
            "loading",
            "unloading",
            "delayed",
            "parked",
            "maintenance",
            "idle"
        ]
        status = random.choice(status_options)

        # 根据状态调整速度（可选优化）
        if status in ["loading", "unloading", "maintenance", "idle"]:
            speed = 0.0
        elif status == "delayed":
            speed = random.uniform(0, 10.0)
        else:
            speed = random.uniform(40.0, 80.0)

        return {
            "device_id": device_id,
            "vehicle_id": self.device_to_vehicle[device_id],
            "latitude": round(new_lat, 6),
            "longitude": round(new_lon, 6),
            "speed": round(speed, 2),
            "direction": 0,  # 假设始终向北（0°）
            "status": status,
            "load": random.randint(1, 100),
            "timestamp": time.time()
        }

    def _delivery_report(self, err, msg):
        """消息发送回调函数，处理发送结果"""
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.info(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    def _device_thread(self, device_id: str):
        """设备线程函数，负责生成和发送数据"""
        logger.info(f"Starting device simulator: {device_id}")

        while self.running:
            try:
                # 1. 发送物流数据 (80%概率)
                if random.random() < 0.8:
                    logistics_data = self._generate_logistics_data(device_id)
                    partition = self._device_id_to_partition(device_id)
                    self.producer.produce(
                        "logistics-data",
                        key=device_id,  # 使用设备ID作为key，替代显式分区
                        value=json.dumps(logistics_data).encode('utf-8'),
                        callback=self._delivery_report
                    )

                # 2. 发送车辆位置数据 (60%概率)
                if random.random() < 0.6:
                    location_data = self._generate_vehicle_location(device_id)
                    self.producer.produce(
                        "vehicle-location",
                        key=device_id,
                        value=json.dumps(location_data).encode('utf-8'),
                        callback=self._delivery_report
                    )

                # 3. 发送告警数据 (低概率)
                if random.random() < 0.1:
                    alert_data = self._generate_alert_data(device_id)
                    self.producer.produce(
                        "alerts",
                        key=device_id,
                        value=json.dumps(alert_data).encode('utf-8'),
                        callback=self._delivery_report
                    )

                # 触发消息发送回调
                self.producer.poll(0)
                time.sleep(self.sleep_interval)

            except Exception as e:
                logger.error(f"Error sending data from {device_id}: {str(e)}")

    def start(self):
        """启动所有设备模拟器线程"""
        self.running = True
        for i in range(self.num_devices):
            device_id = f"D{i:04d}"
            thread = threading.Thread(target=self._device_thread, args=(device_id,))
            thread.daemon = True
            self.threads.append(thread)
            thread.start()
            logger.info(f"Started thread for device: {device_id}")

        logger.info(f"All {self.num_devices} device simulators started")

    def stop(self):
        """停止所有设备模拟器线程并关闭producer"""
        self.running = False
        for thread in self.threads:
            thread.join(timeout=2.0)

        self.producer.flush(timeout=10)  # 增加超时时间确保消息发送
        logger.info("All device simulators stopped")


if __name__ == "__main__":
    # 配置参数（确保Kafka地址正确）
    config = {
        "bootstrap_servers": ["localhost:29092"],
        "num_devices": 10,  # 测试时减少设备数，避免日志过多-
        "partitions_per_topic": 8,
        "sleep_interval": 30.0  # 增加间隔便于观察
    }

    simulator = DeviceSimulator(**config)
    try:
        simulator.start()
        logger.info("Press Ctrl+C to stop...")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping simulator...")
    finally:
        simulator.stop()