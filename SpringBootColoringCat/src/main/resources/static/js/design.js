/*
 * 線画データ（仮の線画）
 */

/*function drawLineArt(ctx, id) {
  //キャンバスの初期化(削除開始座標X,削除開始座標Y,削除範囲の幅,削除範囲の高さ)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  //線の色指定
  ctx.strokeStyle = "#000";
  //線の太さ指定
  ctx.lineWidth = 3;

  //四角
  if (id === "1") {
		//(x,y)座標が20、高さと幅が60の四角形を描く
	    ctx.strokeRect(20, 20, 60, 60);
  //丸
  } else if (id === "2") {
		//線の開始
	    ctx.beginPath();
		//(x,y)座標が50、半径30、開始角度0、終了角度2π※1周分
	    ctx.arc(50, 50, 30, 0, Math.PI * 2);
	    ctx.stroke();
  //三角
  } else if (id === "3") {
	    ctx.beginPath();
		//ペンの現在位置を指定した(x,y)座標に移動
	    ctx.moveTo(20, 80);
		//現在位置から指定した(x,y)座標に線を引く
	    ctx.lineTo(50, 20);
	    ctx.lineTo(80, 80);
		//最後の位置から最初の位置へ線を引く
	    ctx.closePath();
	    ctx.stroke();
  }
}*/
/*
 * サムネイルに線画を描く
 */
//クラス単位でサムネイルをすべて取得して、キャンバスに対して処理をループする
/*document.querySelectorAll(".thumbnail").forEach(canvas => {
  //対象キャンバスのペンを取得
  const ctx = canvas.getContext("2d");
  //線画の描写を呼び出す　drawLineArt(ペン,線画ID)
  drawLineArt(ctx, canvas.dataset.id);
  //サムネイルがクリックされた際は、メインキャンバスに対して指定された線画の描写を行う
  canvas.addEventListener("click", () => {
    const main = document.getElementById("main-canvas").getContext("2d");
    drawLineArt(main, canvas.dataset.id);
  });
});*/
const lineCanvas = document.getElementById("line-canvas");
const lineCtx = lineCanvas.getContext("2d");
/*
 *サムネイルクリックでSVGをメインキャンバスに描画
 */
document.querySelectorAll(".thumbnail").forEach(img => {
	img.addEventListener("click", () => {
		if (isPainted){
			const confirmChange = confirm("現在の塗り絵は保存されません。続行しますか？");
			if (!confirmChange) return;//キャンセルなら処理中断
		}
		
		//マスクが適用されている場合は解除する
		paintCtx.restore();
		const svgPath = img.dataset.src;
		const svgImage = new Image();
		svgImage.src = svgPath;
		
		//画像読込完了時に実行(onload)
		svgImage.onload = () => {
			lineCtx.clearRect(0,0,lineCanvas.width,lineCanvas.height);
			paintCtx.clearRect(0,0,paintCanvas.width,paintCanvas.height);
			//画像の描画(描画画像(オブジェクト),描画開始X座標,描画開始Y座標,描画幅,描画高さ)
			lineCtx.drawImage(svgImage,0,0,lineCanvas.width,lineCanvas.height);
		};
		//マスク適用
		const svgMaskPath = img.dataset.mask;
		applyMask(svgMaskPath);
	});
});

// 塗り絵機能
let currentColor = "#ff0000";//選択色
let painting = false;//マウスでの描画のONOFF状態FLG
let lastX = 0;
let lastY = 0;

//colorクラスのdivをすべてループ処理
document.querySelectorAll(".color").forEach(c => {
  //divの背景色を、div自身に設定されたdata-colorにする
  c.style.background = c.dataset.color;
  //divがクリックされた場合の処理
  c.addEventListener("click", () => {
	//選択色として、クリックされたdivのdata-colorをセット
    currentColor = c.dataset.color;
  });
});

const paintCanvas = document.getElementById("paint-canvas");
const paintCtx = paintCanvas.getContext("2d");
let isPainted = false//塗り絵があるかどうかのフラグ

//マウスの押し込みがされたら描画をON
paintCanvas.addEventListener("mousedown", (e) => {
	isPainted = true; //塗ったらフラグを立てる
	painting = true;
	//キャンバスの画面上の表示位置と大きさの座標
	const rect = paintCanvas.getBoundingClientRect();
	//ブラウザ画面全体に対する位置XY－キャンバスの左上座標＝キャンバス内のローカル座標を取得
	//※マウスクリック時点の座標を保持
	lastX = e.clientX - rect.left;
	lastY = e.clientY - rect.top;
});

//マウスのクリックが離されたら描画をOFF
paintCanvas.addEventListener("mouseup", () => painting = false);
//マウスがキャンバス外にでたら描画をOFF
paintCanvas.addEventListener("mouseleave", () => painting = false);

/*
 * キャンバスでマウスが動いたら処理を行う
 */
paintCanvas.addEventListener("mousemove", (e) => {
  //描画のONOFFFLGを確認し、マウスが押し込まれていないときは処理を抜ける
  if (!painting) return;

  //キャンバスの画面上の表示位置と大きさの座標
  const rect = paintCanvas.getBoundingClientRect();
  //ブラウザ画面全体に対する位置XY－キャンバスの左上座標＝キャンバス内のローカル座標を取得
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  //描画色を選択色にする
  paintCtx.strokeStyle = currentColor;
  paintCtx.lineWidth = 20; //ペンの太さ
  paintCtx.lineCap = "round"; //先端を丸く
  paintCtx.lineJoin = "round";//角をなめらかにする
  
  paintCtx.beginPath();
  paintCtx.moveTo(lastX, lastY);
  paintCtx.lineTo(x,y);
  paintCtx.stroke();
  
  lastX = x;
  lastY = y;
});

/*
 *マスクを適用する
 */
function applyMask(maskFilePath){
	fetch(maskFilePath)//指定ファイルの取得
		.then(res => res.text())//取得ファイルをテキストとして読み込む
		.then(svgText => {
			const parser = new DOMParser();//テキストをXML/HTMLとして解析してDOMにするクラス
			const svgDoc = parser.parseFromString(svgText, "image/svg+xml");//指定テキストをSVGとしてDOM変換
			
			//mask-area パスを取得
			const maskPathElement = svgDoc.getElementById("mask-area");//DOMからID指定で要素取り出し
			const d = maskPathElement.getAttribute("d");//SVGパスの「パスデータ文字列」取得
			
			//Path2Dに変換
			const clipPath = new Path2D(d);//SVGパスデータからPath2Dオブジェクトを生成
			
			paintCtx.save();//現在の状態を保存
			paintCtx.clip(clipPath);//clip適用(この後の描画はマスク内だけ)
			//マスク範囲確認デバッグ用
	/*		paintCtx.fillStyle = "red";
			paintCtx.fillRect(0, 0, 400, 400); // 全面塗り
			paintCtx.restore();*/
	
		});
}
/*
 *ダウンロードボタン押下
 */
document.getElementById("dl-btn").addEventListener("click",() => {
	downloadPainting();
})

/*
 *保存ボタン押下
 */
document.getElementById("save-btn").addEventListener("click",() => {
	savePainting();
});

/*
 *読込ボタン押下
 */
document.getElementById("load-btn").addEventListener("click", () => {
	loadPainting();
});
 
/*
 *塗り絵画像のダウンロード
 */
function downloadPainting(){
	//合成用の一時Canvasを作成
	const mergedCanvas = document.createElement("canvas");//Canvas要素の作成
	mergedCanvas.width = paintCanvas.width;
	mergedCanvas.height = paintCanvas.height;
	const mergedCtx = mergedCanvas.getContext("2d");//一時キャンバスのペンを取得
	
	//背景を白で塗る
	mergedCtx.fillStyle = "#ffffff";
	mergedCtx.fillRect(0,0,mergedCanvas.width,mergedCanvas.height);//(左上のx座標,左上のy座標,幅,高さ)
	
	//塗りCanvasを合成
	mergedCtx.drawImage(paintCanvas,0,0);//drawImage(指定画像,貼り付け座標(左上のx座標),貼り付け座標(左上のy座標))
	
	//線画Canvasを合成
	mergedCtx.drawImage(lineCanvas,0,0);
	
	//PNGとして保存
	const link = document.createElement("a");//アンカータグでリンク要素を作成
	link.download = "coloring.png";//ダウンロード時の保存ファイル名
	link.href = mergedCanvas.toDataURL("image/png");//PNG用の文字列に変換した塗りCanvasをリンクにセット
	link.click();//リンク自動クリック
}
/*
 *データ保存
 */
function savePainting(){
	//塗りCanvasデータを文字列に変換
	const dataUrl = paintCanvas.toDataURL("image/png");

/*	console.log("paintCanvas:", paintCanvas);
	console.log("dataUrl:", dataUrl);
	console.log("dataUrl length:", dataUrl.length);*/

	//指定URLにHTTPリクエストを送る
	fetch("/design/save",{
		method: "POST",
		headers: {"Content-Type": "application/json"}, //JSON形式を指定
		body: JSON.stringify({ //サーバーに送るデータ指定
			imageData: dataUrl //文字列をJSON形式に変換
		})
	})
	.then(res => res.json()) //サーバーから返却されたRESをJSONとして読み込む
	.then(data => { //上記のJSONデータをdataとして受け取る→dataは未使用
		alert("保存しました");
	});
}
/*
 *塗り絵復元
 */
function loadPainting(){
	//指定URLにHTTPリクエストを送る
	fetch("/design/load")
	.then(res => res.json()) //サーバーから返却されたRESをJSONとして読み込む
	.then(data => { //上記のJSONデータをdataとして受け取る
		//imageDataが空文字だったら何もしない
		if (!data.imageData) return;
		
		const img = new Image();//イメージオブジェクトの生成。画像コンテナ
		img.src = data.imageData;//画像のソースにBase64PNGをセット
		img.onload = () => {//画像が読み込まれた後に処理を実行
			//塗りキャンバスに描写(画像、X座標、Y座標、描写幅、描写高さ)
			paintCtx.drawImage(img, 0, 0, paintCanvas.width, paintCanvas.height);
		};
	});	
}
 
 