package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.ColoringData;

//JPA(保存・更新・削除・検索イベント)を継承
public interface ColoringRepository extends JpaRepository<ColoringData, Long>{
	//最後に保存した1件を検索
	Optional<ColoringData> findByUserId(String userId);//引数UserIdをキーに戻り値ColoringDataを返すイベント
	//ユーザーの全データ一覧
	List<ColoringData> findAllByUserId(String userId);
	//選択データの削除
	void deleteByUserIdAndId(String userId, Long id);
}
