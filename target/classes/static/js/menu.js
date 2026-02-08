/**
 * 
 */
document.addEventListener('DOMContentLoaded', () => {
// メニューの開閉ボタン（ロゴ）
const logo = document.querySelector('.logo');
//オーバーレイ
const overlay = document.querySelector('.overlay');
// ナビゲーションメニュー
const navMenu = document.querySelector('.nav-menu');

if (!logo || !overlay || !navMenu) return;

// メニュー開閉処理
const toggleMenu = () => {
	navMenu.classList.toggle('active');
	overlay.classList.toggle('active');
};
//ロゴクリックで開閉
logo.addEventListener('click',toggleMenu);

//オーバーレイクリックで閉じる
overlay.addEventListener('click',() => {
	navMenu.classList.remove('active');
	overlay.classList.remove('active');
});
});