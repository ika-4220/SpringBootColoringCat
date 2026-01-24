package com.example.demo.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.demo.entity.ColoringData;
import com.example.demo.repository.ColoringRepository;

@Controller
public class DesignController {
	/*デザイン画面を表示*/
	@GetMapping("/design")
	public String getDesign(Model model) {
		List<Map<String, String>> thumbnails = new ArrayList<>();

		thumbnails.add(Map.of(
				"line", "/svg/catface.svg",
				"mask", "/svg/catface_mask.svg"));
		thumbnails.add(Map.of(
				"line", "/svg/catface.svg",
				"mask", "/svg/catface_mask2.svg"));
		model.addAttribute("thumbnails", thumbnails);
		System.out.println("DEBUG thumbnails = " + thumbnails);

		return "design/design";
	}

	@Autowired
	private ColoringRepository coloringRepository;

	@PostMapping("/design/save")
	//戻り値をHTTPレスポンスのボディ(JSONに変換されてクライアントに返される)として返却
	@ResponseBody
	public Map<String, Object> save(@RequestBody Map<String, String> body) {//画面から返却されるJSONをbodyにマッピング
		//ログイン中ユーザーを取得
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String userId = auth.getName(); //ユーザー名取得

		String imageData = body.get("imageData");//返却値imageDataに塗り絵JSONデータが入っているので取得
		ColoringData data = new ColoringData();//エンティティオブジェクトのインスタンス化
		data.setImageData(imageData);//オブジェクトにimageDataをセット
		data.setUserId(userId);//オブジェクトにUserIdをセット

		coloringRepository.save(data);//JPAのRepositoryを使用してオブジェクトをDBに保存
						System.out.println("imageData length =" + imageData.length());
						System.out.println("imageData = " + imageData);
						System.out.println("data.setImageData = " + data.getImageData());
		return Map.of("status", "ok");

	}

	@GetMapping("/design/load")
	@ResponseBody //戻り値をHTTPレスポンスのボディとして返却
	public Map<String, Object> load() {

		ColoringData data = coloringRepository.findByUserId("user1")//検索イベントの戻り値を取得
				.orElse(null);//戻り値Optionalから中身を取り出す。空オブジェクトだったらNULLをセット。
		if (data == null) {
			return Map.of("imageData", null);//データなし
		}
		return Map.of("imageData", data.getImageData());//Base64PNGをimageDataとして返却する

	}
}
