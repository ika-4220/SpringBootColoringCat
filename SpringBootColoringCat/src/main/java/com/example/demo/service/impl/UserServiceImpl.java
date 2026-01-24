package com.example.demo.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.mapper.UserMapper;
import com.example.demo.service.UserService;
import com.example.demo.user.model.MUser;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserServiceImpl implements UserService{
	@Autowired
	private UserMapper mapper;
	@Autowired
	private PasswordEncoder passwordEncoder;
	/* ログインユーザー情報取得 */
	@Override
	public MUser getLoginUser(String userId) {
		log.debug("Signup request receivedgetImpl: userId={}", 
				userId);//ログ
		return mapper.findLoginUser(userId);
	}
	/* ユーザー登録 */
	@Override
	public void insertUser(MUser user) {

		//パスワードハッシュ化
		String hashedPassword = passwordEncoder.encode(user.getPassword());
		user.setPassword(hashedPassword);
		log.debug("Signup request receivedImpl: userId={}, password={}", 
				user.getUserId(), user.getPassword());//ログ
		mapper.insertUser(user);
	}
}
