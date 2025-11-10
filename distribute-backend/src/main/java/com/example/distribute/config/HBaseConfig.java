package com.example.distribute.config;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.hbase.HBaseConfiguration;
import org.apache.hadoop.hbase.client.Connection;
import org.apache.hadoop.hbase.client.ConnectionFactory;
import org.springframework.context.annotation.Bean;

import java.io.IOException;

@org.springframework.context.annotation.Configuration
public class HBaseConfig {

    @Bean
    public Connection hbaseConnection() throws IOException {
        Configuration config = HBaseConfiguration.create();
        config.set("hbase.zookeeper.quorum", "localhost"); // 或 zookeeper 容器名称
        config.set("hbase.zookeeper.property.clientPort", "2181");
        config.set("hbase.client.operation.timeout", "3000");
        config.set("hbase.client.scanner.timeout.period", "10000");
        return ConnectionFactory.createConnection(config);
    }
}
