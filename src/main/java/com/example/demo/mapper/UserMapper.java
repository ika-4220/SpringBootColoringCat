package com.example.demo.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.example.demo.user.model.MUser;

@Mapper
public interface UserMapper {
	/* ログインユーザー情報取得 */
	public MUser findLoginUser(String userId);
	/* ユーザー登録 */
	public int insertUser(MUser user);
}
