package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class HomeController {
	/*ホーム画面を表示*/
	@GetMapping("/home")
	public String getHome() {
		return "home/home";
	}
	
	/*デザイン画面を表示*/
	@PostMapping("/home")
	public String getDesign() {
		return "redirect:/design";
	}
	  	/*デザイン画面を表示
		@PostMapping(value="/design", params="design")
		public String getDesign() {
			return "design/design";
		}
		ログイン画面を表示
		@PostMapping(value="/login", params="login")
		public String getLogin() {
			return "login/login";
		}*/
}
