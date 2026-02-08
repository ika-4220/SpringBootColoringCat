package com.example.demo.service;

import com.example.demo.user.model.MUser;

public interface UserService {
	/*ログインユーザー情報取得*/
	public MUser getLoginUser(String userId);
	/*ユーザー登録*/
	public void insertUser(MUser user);
}
