package com.example.demo.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.demo.entity.ColoringData;
import com.example.demo.repository.ColoringRepository;

@Controller
public class DesignController {
	
    /* thumbnails を共通生成するメソッド */
    private List<Map<String, String>> createThumbnails() {
        List<Map<String, String>> thumbnails = new ArrayList<>();

        thumbnails.add(Map.of(
                "lineid","1",
                "line", "/svg/線画猫_リアル_id.svg",
                "mask", "/svg/線画猫_リアル_id.svg"));
        thumbnails.add(Map.of(
                "lineid","2",
                "line", "/svg/線画猫_デフォルメ_id.svg",
                "mask", "/svg/線画猫_デフォルメ_id.svg"));
        thumbnails.add(Map.of(
                "lineid","3",
                "line", "/svg/線画猫_凝視_id.svg",
                "mask", "/svg/線画猫_凝視_id.svg"));
        thumbnails.add(Map.of(
                "lineid","4",
                "line", "/svg/線画猫_通常_id.svg",
                "mask", "/svg/線画猫_通常_id.svg"));
        thumbnails.add(Map.of(
                "lineid","5",
                "line", "/svg/線画猫_怒り_id.svg",
                "mask", "/svg/線画猫_怒り_id.svg"));

        return thumbnails;
    }

	/*デザイン画面を表示*/
	@GetMapping("/design")
	public String getDesign(Model model) {
		List<Map<String, String>> thumbnails = createThumbnails();

		model.addAttribute("thumbnails", thumbnails);
		System.out.println("DEBUG thumbnails = " + thumbnails);
		
		/*ログインユーザーの保存済み塗り絵サムネイルの取得処理*/
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
			String userId = auth.getName();
			
			//ユーザーの保存済みデータ一覧を取得
			List<ColoringData> list = coloringRepository.findAllByUserId(userId);
			
			//Thymeleafに渡すためのDTO形式に変換
			List<Map<String, String>> userPaintings = new ArrayList<>();
			for (ColoringData d : list) {
				userPaintings.add(Map.of(
						"imageData", d.getImageData(),				//メインキャンバスに復元する用
						"thumbnailData", d.getImageData(),			//サムネイル表示用
						"lineId", String.valueOf(d.getLineId())	,	//線画ID
						"id", String.valueOf(d.getId())		//画像ID
						));
			}
			model.addAttribute("userPaintings",userPaintings);
		}

		return "design/design";
	}

	@Autowired
	private ColoringRepository coloringRepository;

	//@CrossOrigin(origins = "*")//すべてのオリジンを許可
	@PostMapping("/design/save")
	//戻り値をHTTPレスポンスのボディ(JSONに変換されてクライアントに返される)として返却
	@ResponseBody
	public Map<String, Object> save(@RequestBody Map<String, String> body) {//画面から返却されるJSONをbodyにマッピング
		//ログイン中ユーザーを取得
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String userId = auth.getName(); //ユーザー名取得

		String imageData = body.get("imageData");//返却値imageDataに塗り絵JSONデータが入っているので取得
		Long lineId = Long.valueOf(body.get("lineId"));//返却値lineIdに線画IDが入っているので取得
		ColoringData data = new ColoringData();//エンティティオブジェクトのインスタンス化
		data.setImageData(imageData);//オブジェクトにimageDataをセット
		data.setUserId(userId);//オブジェクトにUserIdをセット
		data.setLineId(lineId);//オブジェクトにlineIdをセット

		System.out.println("imageData length =" + imageData.length());
		System.out.println("imageData = " + imageData);
		System.out.println("data.setImageData = " + data.getImageData());
		coloringRepository.save(data);//JPAのRepositoryを使用してオブジェクトをDBに保存

		return Map.of("status", "ok");

	}

	@GetMapping("/design/load")
	@ResponseBody //戻り値をHTTPレスポンスのボディとして返却
	public Map<String, Object> load() {
		//ログイン中ユーザーを取得
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String userId = auth.getName(); //ユーザー名取得
		
		ColoringData data = coloringRepository.findByUserId(userId)//検索イベントの戻り値を取得
				.orElse(null);//戻り値Optionalから中身を取り出す。空オブジェクトだったらNULLをセット。
		if (data == null) {
			return Map.of("imageData", null);//データなし
		}
		return Map.of("imageData", data.getImageData());//Base64PNGをimageDataとして返却する

	}
	
	@Transactional
	@PostMapping("/design/delete")
	@ResponseBody
	public Map<String, Object> delete(@RequestBody Map<String, String> body) {

	    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
	    String userId = auth.getName();
	    Long id = Long.valueOf(body.get("id"));

	    coloringRepository.deleteByUserIdAndId(userId, id);

	    return Map.of("status", "ok");
	}

	@GetMapping("/design/user-thumbnails")
	public String getUserThumbnails(Model model) {

	    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
	    String userId = auth.getName();

	    List<ColoringData> list = coloringRepository.findAllByUserId(userId);

	    List<Map<String, String>> userPaintings = new ArrayList<>();
	    for (ColoringData d : list) {
	        userPaintings.add(Map.of(
	            "id", String.valueOf(d.getId()),
	            "lineId", String.valueOf(d.getLineId()),
	            "imageData", d.getImageData(),
	            "thumbnailData", d.getImageData()
	        ));
	    }

	    model.addAttribute("userPaintings", userPaintings);
	    model.addAttribute("thumbnails", createThumbnails());

	    return "design/userThumbnail :: userThumbnails"; // fragment だけ返す
	}
}
