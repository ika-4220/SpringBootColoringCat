package com.example.demo.config;

import org.springframework.boot.security.autoconfigure.web.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@EnableWebSecurity //Webセキュリティ有効化
@Configuration
public class SecurityConfig {
	/*	//SpringSecurityが認証時に使用するユーザー情報取得ロジック
		@Bean
		public UserDetailsService userDetailsService() {
			return new UserDetailsServiceImpl();
		}*/
	
	//パスワードエンコーダ(SpringSecurityが使用するパスワード照合ロジック)
	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();//BCryptでパスワードハッシュ化
	}
	
	//認証マネージャー
	//内部的にuserDetailsService,passwordEncoderを使用して認証を行っている、他クラスから呼び出せるように公開する
	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception{
		return config.getAuthenticationManager();
	}
	
	//セキュリティ設定本体(SecurityFilterChain)
	//(URLにどういった制限をかけるか決定)
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
		http
			//HTTPリクエストごとのアクセス権限を設定
			.authorizeHttpRequests(auth -> auth
					//静的リソースを一括で許可
					.requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
					.requestMatchers("/login","/user/signup","/home").permitAll() //ログインなしでOK
					.anyRequest().authenticated() //上記以外のURLはログイン必須
					)
			//フォームベースのログイン設定
			.formLogin(login -> login
					.loginPage("/login") //ログイン画面のURL
					.loginProcessingUrl("/login") //ログインボタンのPOST先
					.usernameParameter("userId")
					.passwordParameter("password")
					.defaultSuccessUrl("/design") //ログイン成功後にリダイレクトする先 
					.failureUrl("/login?error") //ログイン失敗時にリダイレクトする先
					.permitAll() //ログイン処理自体はログインなしでOK
					)
			//ログアウト設定
			.logout(logout -> logout
					.logoutUrl("/logout")//ログアウトURL
					.logoutSuccessUrl("/login?logout")//ログアウト成功後の遷移先
					);
		return http.build();			
	}
}
