package com.example.demo;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.demo.mapper")
/*public class SpringBootColoringCatApplication extends SpringBootServletInitializer{

	public static void main(String[] args) {
		SpringApplication.run(SpringBootColoringCatApplication.class, args);
	}
	
	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
		return builder.sources(SpringBootColoringCatApplication.class);
	}
}*/
public class SpringBootColoringCatApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringBootColoringCatApplication.class, args);
	}

}