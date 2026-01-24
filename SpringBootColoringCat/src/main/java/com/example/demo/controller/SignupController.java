package com.example.demo.controller;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.demo.form.SignupForm;
import com.example.demo.service.UserService;
import com.example.demo.user.model.MUser;

import lombok.extern.slf4j.Slf4j;
@Slf4j
@Controller
@RequestMapping("/user")
public class SignupController {
	@Autowired
	private ModelMapper modelMapper;
	@Autowired
	private UserService userService;
	
	/*ユーザー登録画面を表示*/
	@GetMapping("/signup")
	public String getSignup(@ModelAttribute SignupForm form) {
		return "user/signup";
	}
	/*ユーザー登録処理*/
	@PostMapping("/signup")
	public String postSignup(Model model, @ModelAttribute SignupForm form) {
		log.debug("Signup request received: userId={}, password={}", 
                form.getUserId(), form.getPassword());//ログ

		MUser user = modelMapper.map(form, MUser.class);
		userService.insertUser(user);
		
		return "login/login";
	}
}
