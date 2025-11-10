from pyspark.sql.types import StructType, StringType, DoubleType, IntegerType
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json
import os
import time
import redis
import happybase
import pymysql
import logging

# 设置 Java 环境
os.environ["JAVA_HOME"] = "/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home"

# 1. 配置 logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("write_to_stores")

# 定义 Schema
logistics_schema = StructType() \
    .add("device_id", StringType()) \
    .add("package_id", StringType()) \
    .add("temperature", DoubleType()) \
    .add("humidity", IntegerType()) \
    .add("status", StringType()) \
    .add("timestamp", DoubleType())

location_schema = StructType() \
    .add("device_id", StringType()) \
    .add("vehicle_id", StringType()) \
    .add("latitude", DoubleType()) \
    .add("longitude", DoubleType()) \
    .add("speed", DoubleType()) \
    .add("direction", IntegerType()) \
    .add("status", StringType()) \
    .add("load", IntegerType()) \
    .add("timestamp", DoubleType())

alert_schema = StructType() \
    .add("device_id", StringType()) \
    .add("alert_type", StringType()) \
    .add("severity", StringType()) \
    .add("timestamp", DoubleType()) \
    .add("details", StringType())

# 依赖 JAR 路径（绝对路径）
base = "/Users/mac/Desktop/Distribute/setup/jars"
jar_paths = [
    os.path.join(base, "spark-sql-kafka-0-10_2.12-3.4.1.jar"),
    os.path.join(base, "kafka-clients-3.2.0.jar"),
    os.path.join(base, "scala-library-2.12.15.jar"),
    os.path.join(base, "spark-token-provider-kafka-0-10_2.12-3.4.1.jar"),
    os.path.join(base, "commons-pool2-2.11.1.jar")
]

# 初始化 SparkSession
spark = SparkSession.builder \
    .appName("KafkaMultiTopicConsumer") \
    .master("local[*]") \
    .config("spark.jars", ",".join(jar_paths)) \
    .getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# 存储系统连接配置
redis_pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
hbase_conn = happybase.Connection(host='localhost', port=9090)
mysql_params = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root',
    'database': 'logistics',
    'autocommit': True
}


def write_to_stores(df, epoch_id):
    count = df.count()
    logger.info(f"['batch': {epoch_id}] 开始写入，共 {count} 条记录")

    # 打印示例几条记录便于调试
    df.printSchema()
    df.show(5, truncate=False)

    # 初始化连接
    r = redis.Redis(connection_pool=redis_pool)
    htable = hbase_conn.table('vehicle_tracking')
    conn = pymysql.connect(**mysql_params)
    cursor = conn.cursor()

    for row in df.collect():
        topic = row['topic']
        try:
            if topic == 'vehicle-location':
                vid = row['vehicle_id']
                with r.pipeline() as pipe:
                    # 写 Redis
                    pipe.hset(f"vehicle:{vid}", mapping={
                        'lat': row['latitude'],
                        'lon': row['longitude'],
                        'speed': row['speed'],
                        'dir': row['direction'],
                        'status': row['status'],
                        'load': row['load'],
                        'timestamp': row['timestamp']
                    })
                    # 维护 Redis 集合
                    pipe.sadd("vehicle:keys", f"vehicle:{vid}")
                    pipe.execute()
                # 写 HBase
                rk = f"{vid}_{int(row['timestamp'])}"
                htable.put(rk, {
                    'loc:lat': str(row['latitude']),
                    'loc:lon': str(row['longitude']),
                    'stat:speed': str(row['speed']),
                    'stat:dir': str(row['direction']),
                    'stat:status': row['status']
                })
                logger.info(f"['batch': {epoch_id}] Vehicle {vid} 写入 Redis/HBase 成功")


            elif topic == 'logistics-data':
                oid = row['package_id']
                status = row['status']
                # 将 timestamp 转换成 DATETIME 字符串
                evt_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(row['timestamp']))
                table = f"order_{time.strftime('%Y%m', time.localtime(row['timestamp']))}"
                sql = (
                    f"INSERT INTO {table} "
                    "(order_id, user_id, vehicle_id, start_time, end_time, status, temperature, humidity, event_time) "
                    "VALUES (%s, %s, %s, NOW(), NOW(), %s, %s, %s, %s)"
                )
                cursor.execute(sql, (
                    oid,
                    None,
                    row['device_id'],
                    status,
                    row['temperature'],
                    row['humidity'],
                    evt_time
                ))
                logger.info(f"['batch': {epoch_id}] Package {oid} 写入 MySQL 表 {table} 成功")


            elif topic == 'alerts':
                vid = row['device_id']
                sql = (
                    "INSERT INTO alarm_log "
                    "(vehicle_id, type, severity, timestamp, detail) "
                    "VALUES (%s, %s, %s, FROM_UNIXTIME(%s), %s)"
                )
                cursor.execute(sql, (vid, row['alert_type'], row['severity'], row['timestamp'], row['details']))
                logger.info(f"['batch': {epoch_id}] Alert {row['alert_type']} for {vid} 写入 MySQL 成功")

        except Exception as e:
            logger.error(f"['batch': {epoch_id}] 写入失败: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    logger.info(f"['batch': {epoch_id}] 本批次写入完毕")


# 读取 Kafka 多主题流
df_raw = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:29092") \
    .option("subscribe", "logistics-data,vehicle-location,alerts") \
    .option("startingOffsets", "latest") \
    .load()

# 转换为字符串
df_json = df_raw.selectExpr("CAST(topic AS STRING)", "CAST(value AS STRING) as json_str")

# 按主题解析 JSON
df_logistics = df_json.filter(col("topic") == "logistics-data") \
    .withColumn("parsed", from_json(col("json_str"), logistics_schema)) \
    .select("topic", "parsed.*")

df_location = df_json.filter(col("topic") == "vehicle-location") \
    .withColumn("parsed", from_json(col("json_str"), location_schema)) \
    .select("topic", "parsed.*")

df_alerts = df_json.filter(col("topic") == "alerts") \
    .withColumn("parsed", from_json(col("json_str"), alert_schema)) \
    .select("topic", "parsed.*")

# 合并流
df_all = df_logistics.unionByName(df_location, allowMissingColumns=True) \
    .unionByName(df_alerts, allowMissingColumns=True)

# 输出并写入存储
query = df_all.writeStream \
    .foreachBatch(write_to_stores) \
    .outputMode("append") \
    .start()

query.awaitTermination()
