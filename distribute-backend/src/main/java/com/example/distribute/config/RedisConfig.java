package com.example.distribute.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import redis.clients.jedis.JedisPool;


@Configuration
public class RedisConfig {

    @Bean
    public JedisPool jedisPool() {
        GenericObjectPoolConfig poolConfig = new GenericObjectPoolConfig();
        poolConfig.setJmxEnabled(false);  // 禁用JMX注册，避免MBean重复异常
        return new JedisPool(poolConfig, "localhost", 6379);
    }
}
