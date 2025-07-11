---
title: HTB Reverse Engineering 路线笔记（一）：Simple Encryptor
date: 2025-07-01
categories: 
- Reverse_Engineering
tags:
- HACKTHEBOX
- Reverse_Engineering
---
## 0x00 加密分析
拖入binary ninja
![](Simple%20Encryptor.assets/9cf0c5ff4b6448ec9ba9745402c209aa.png)
内容
```c
00001295      void* fsbase
00001295      int64_t rax = *(fsbase + 0x28)
			 // 加载文件
000012b2      FILE* fp = fopen(filename: "flag", mode: &data_2004)
			 // 获取文件长度
000012cc      fseek(fp, offset: 0, whence: 2)
000012d8      int64_t rax_4 = ftell(fp)
000012f2      fseek(fp, offset: 0, whence: 0)
			 // 申请内存
000012fe      void* buf = malloc(bytes: rax_4)
			 // 将flag 写人内存
0000131e      fread(buf, size: rax_4, count: 1, fp)
0000132a      fclose(fp)
			 // 获取当前时间戳并设置伪随机数种子
00001339      uint32_t var_40 = time(nullptr)
00001341      srand(x: var_40)
00001341      
000013c8      for (int64_t i = 0; i s< rax_4; i += 1)
			 // 将每位与第一个随机数异或后，循环左移 第二个随机数与7 的位数
00001350          char rax_11 = rand()
0000137b          *(buf + i) ^= rax_11
00001382          char rax_19 = rand() & 7
000013b9          *(buf + i) = rol.b(*(buf + i), rax_19)
000013b9      
			 // 将时间戳与加密后的内容写入文件
000013d8      FILE* fp_1 = fopen(filename: "flag.enc", mode: &data_200c)
000013f9      fwrite(buf: &var_40, size: 1, count: 4, fp: fp_1)
00001412      fwrite(buf, size: 1, count: rax_4, fp: fp_1)
0000141e      fclose(fp: fp_1)
0000141e      
00001435      if (rax == *(fsbase + 0x28))
0000143d          return 0
0000143d      
00001437      __stack_chk_fail()
00001437      noreturn

```

> rol.b 按位循环左移 ，.b 表示操作一个字节

## 0x01 解密
解密思路
获取时间戳设置种子 -> 循环每位（生成随机数a、b=b&7 -> 循环右移 b 位 -> 异或a）-> flag
**代码：**

```rust 
use std::fs::File;
use std::io::Read;

// 声明 C 函数
unsafe extern "C" {
    pub fn srand(seed: u32);
    pub fn rand() -> i32;
}

// 解密函数
fn decrypt_byte(x:&u8) -> u8 {
    unsafe{
        let rd1 = rand() as u8;
        let rd2 = (rand() & 7) as u32;
        let rotate = x.rotate_right(rd2);
        rotate ^ rd1
    }
}

fn main() {

    // 打开文件
    let mut file = File::open("/root/htb/Reverse Engeneering/rev_simpleencryptor/flag.enc").unwrap();
    // 获取文件大小
    let file_size = file.metadata().unwrap().len() as usize;
    // println!("{}",file_size);
    // 申请内存
    let mut buffer = vec![0u8;file_size];
    // 读取文件内容写入内存
    file.read_exact(&mut buffer).unwrap();
    // 获取 时间戳
    let timestamp = u32::from_le_bytes(buffer[0..4].try_into().unwrap());
    // 剩余加密数据
    let encrypted_data = &buffer[4..];
    // println!("{}",encrypted_data.len());

    println!("The encryption timestamp is: {}", timestamp);

    unsafe{
        // 设置随机数种子
        srand(timestamp);
        // 遍历并生成新数组
        let decrypt_data: Vec<u8> = encrypted_data.iter().map(decrypt_byte).collect();
        // 转成字符串
        let s = String::from_utf8(decrypt_data).unwrap();

        println!("The flag is: {}", s);
    }
}

```