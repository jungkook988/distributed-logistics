package com.example.distribute.service;

import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.client.Connection;
import org.apache.hadoop.hbase.client.Result;
import org.apache.hadoop.hbase.client.ResultScanner;
import org.apache.hadoop.hbase.client.Scan;
import org.apache.hadoop.hbase.client.Table;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class MapService {
	@Autowired
    private Connection hbaseConn;
	
	/**
     * 获取各车辆在时间区间[from,to]内的轨迹点，按 vehicleId 分组返回
     */
    public List<Map<String, Object>> getVehiclePaths(Long from, Long to) throws IOException {
        List<Map<String, Object>> result = new ArrayList<>();
        Table table = hbaseConn.getTable(TableName.valueOf("vehicle_tracking"));
        Scan scan = new Scan()
                .setTimeRange(from * 1000, to * 1000)  // HBase timestamp 单位 ms
                .addFamily(Bytes.toBytes("loc"));       // 只取 loc 列簇
        ResultScanner scanner = table.getScanner(scan);

        // 临时缓存： vehicleId -> List<[lng,lat]> 
        Map<String, List<double[]>> paths = new HashMap<>();

        for (Result row : scanner) {
            String rk = Bytes.toString(row.getRow());      // 格式：V001_1620000000
            String[] parts = rk.split("_");
            String vid = parts[0];
            long ts = Long.parseLong(parts[1]) * 1000;

            double lat = Double.parseDouble(
                Bytes.toString(row.getValue(Bytes.toBytes("loc"), Bytes.toBytes("lat")))
            );
            double lon = Double.parseDouble(
                Bytes.toString(row.getValue(Bytes.toBytes("loc"), Bytes.toBytes("lon")))
            );

            paths.computeIfAbsent(vid, k -> new ArrayList<>()).add(new double[]{lon, lat});
        }
        scanner.close();

        // 构造结果
        for (var entry : paths.entrySet()) {
            result.add(Map.of(
                "vehicleId", entry.getKey(),
                "path", entry.getValue()
            ));
        }
        return result;
    }

    /**
     * 简单的热力数据：将所有点按经纬度网格化，统计密度
     */
    public List<Map<String, Object>> getHeatmapData(Long from, Long to) throws IOException {
        Table table = hbaseConn.getTable(TableName.valueOf("vehicle_tracking"));
        Scan scan = new Scan()
                .setTimeRange(from * 1000, to * 1000)
                .addFamily(Bytes.toBytes("loc"));
        ResultScanner scanner = table.getScanner(scan);

        // 网格 key = floor(lat*100)/100 + "_" + floor(lon*100)/100
        Map<String, Integer> counts = new HashMap<>();
        for (Result row : scanner) {
            double lat = Double.parseDouble(
                Bytes.toString(row.getValue(Bytes.toBytes("loc"), Bytes.toBytes("lat"))));
            double lon = Double.parseDouble(
                Bytes.toString(row.getValue(Bytes.toBytes("loc"), Bytes.toBytes("lon"))));
            String key = String.format("%.2f_%.2f", Math.floor(lat * 100) / 100, Math.floor(lon * 100) / 100);
            counts.merge(key, 1, Integer::sum);
        }
        scanner.close();

        // 转成列表
        List<Map<String, Object>> heat = new ArrayList<>();
        for (var e : counts.entrySet()) {
            String[] xy = e.getKey().split("_");
            heat.add(Map.of(
                "lat", Double.parseDouble(xy[0]),
                "lng", Double.parseDouble(xy[1]),
                "density", e.getValue()
            ));
        }
        return heat;
    }
}