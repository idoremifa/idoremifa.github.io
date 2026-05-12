---
title: "미니 PC 한 대로 시작한 우당탕탕 홈서버 셋업기"
slug: homeserver-baseline-setup
pubDatetime: 2026-05-09T09:00:00+09:00
description: Minisforum UM890 Pro에 Ubuntu Server를 설치하고, 키 기반 SSH·UFW·자동 보안 업데이트·/srv 구조·Tailscale-only 접속까지 — 오래 켜져 있어도 흔들리지 않을 홈서버 기본 운영 골격을 잡아본 첫 번째 셋업 기록이에요.
draft: false
tags:
  - homelab
  - infra
---

오늘은 미니 PC 한 대를 홈서버로 세팅하면서 운영의 기본 골격을 잡아간 이야기를 풀어보려고 해요. 막상 해보니 별것 아닌 줄 알았던 단계마다 잠깐씩 멈춰 서게 되는 순간이 있더라고요.

언젠가부터 집에도 서버 한 대쯤 두고 싶다는 생각이 있었어요. 단순히 앱 몇 개를 띄우는 PC가 아니라, 접속 경로와 업데이트, 방화벽, 디렉터리 구조까지 어느 정도 기준을 갖춘 작지만 단단한 운영 인프라를 한 번 만들어보고 싶었거든요.

이 글에서는 Minisforum UM890 Pro에 Ubuntu Server를 설치하고, 홈서버로 쓰기 위한 첫 번째 세팅을 하나씩 정리해요. Docker나 실제 서비스 운영은 다음 단계로 미뤄뒀어요. 한 번에 욕심내서 다 올렸다가 어디부터 잘못된 건지 못 찾고 다시 갈아엎은 적이 있어서, 이번에는 서버가 오래 켜져 있어도 흔들리지 않을 기본 골격을 잡는 데에만 집중했어요.

목표는 단순해요. 처음 세팅하는 동안에는 집 안에서 내부 IP로 안전하게 접속을 확인하고, Tailscale 연결이 확인된 뒤에는 SSH를 Tailscale 경유로만 허용하는 쪽으로 좁히려고 해요. 여기에 키 기반 SSH, 방화벽, 자동 보안 업데이트, 시간 설정, 운영 디렉터리까지 최소한의 기준을 만들어두는 것이 목표예요.

이 글은 아래 환경을 기준으로 적었어요.

| 항목         | 기준                                             |
| ----------- | ----------------------------------------------- |
| 서버 장비     | Minisforum UM890 Pro                            |
| 서버 OS      | Ubuntu Server 26.04 LTS                         |
| 접속 클라이언트 | macOS 노트북                                     |
| 원격 접속 방식 | 일반 SSH + 초기 내부 IP, 최종 Tailscale IP/MagicDNS |
| 공개 포트     | 공유기 포트포워딩 없이, 최종 SSH는 Tailscale-only      |


## 장비 고르기

홈서버로 쓸 수 있는 하드웨어는 정말 다양해요. 오래된 노트북을 써도 되고, 라즈베리 파이나 NAS, 미니 PC를 골라도 돼요. 저는 이번에 중고로 얻은 미니 PC를 이용해서 홈서버를 만들기로 했어요.

이번에 사용할 장비는 **Minisforum UM890 Pro**예요.

이 글은 장비 리뷰보다는 운영 세팅 쪽에 초점을 두려고 해요. 그래서 다른 미니 PC나 오래된 데스크톱을 쓰시더라도, Ubuntu Server가 설치되고 유선 네트워크와 SSH 접속이 가능하다면 거의 같은 흐름으로 따라오실 수 있어요.

## Ubuntu Server 설치하기

이 글은 2026년 5월 기준 Ubuntu Server 26.04 LTS를 기준으로 작성했어요. 다른 LTS 버전을 쓰더라도 큰 흐름은 비슷하지만, 설치 화면 문구나 기본 패키지 버전은 조금 다를 수 있어요.

### 준비할 것

- <https://ubuntu.com/download/server>에서 **Ubuntu 26.04 LTS ISO 파일 다운로드**
- balenaEtcher로 Ubuntu 부팅 USB 만들기
- 모니터, 키보드, 랜선을 미니 PC에 연결
- 부팅 USB를 미니 PC에 꽂고 미니 PC 전원 켜기
- 부팅 직후 BIOS 설정 유틸리티가 시작될 때까지 `DEL` 키를 연타

### 설치 화면에서 선택한 값

USB 부팅 후 인스톨러 화면 순서대로 정리해봤어요.

1. **GRUB 메뉴** → `Try or Install Ubuntu Server`
2. **Language** → `English`
3. **Keyboard configuration** → 모두 `English (US)`
4. **Choose the type of installation** → `Ubuntu Server`
5. **Network configuration** → `en`으로 시작하는 인터페이스에 IP(`192.168.x.x`) 표시 확인 후 넘어가기
6. **Proxy configuration** → 그대로 넘어가기
7. **Ubuntu archive mirror** → 기본 값
   - 느리면 `http://mirror.kakao.com/ubuntu/` 같은 가까운 미러로 변경
8. **Guided storage configuration** → `Use an entire disk`
   - 단순 구성을 위해 LVM group은 해제했어요.
9. **Storage configuration** → size 확인 후 넘어가기
10. **Profile configuration** → 계정 정보 입력
    - "Your server name": 호스트네임
    - "Pick a username": 로그인 아이디
    - "Choose a password": 로그인 비밀번호
    - 호스트네임과 로그인 아이디는 서로 다른 값으로 분리해두면 나중에 헷갈리지 않아요
11. **Upgrade to Ubuntu Pro** → `Skip for now`
12. **SSH configuration** → `Install OpenSSH server` 체크
    - 원격 접속용. 나중에 따로 설치할 수도 있어요.
13. **Featured server snaps** → 선택 없이 넘어가기
14. **Installation complete!** → `Reboot Now`
    - "FAILED ... press ENTER" 메시지가 나오면 USB를 빼고 Enter

재부팅이 끝나면 Profile configuration에서 설정한 username과 password로 로그인해요.

## 예시 값 맞춰두기

아래 명령어 예시에서 `사용자명`, `서버IP`, `서버 이름`, `Tailscale IP`는 실제 값으로 바꿔야 해요. 저는 글에서 다음 값을 기준으로 설명해요.

| 항목          | 글에서 쓰는 예시 값 | 어디서 확인하나요                            |
| ------------ | -------------- | ---------------------------------------- |
| 사용자명       | `ido`          | 서버에서 `whoami`                           |
| 서버 IP       | `192.168.0.10` | 서버에서 `hostname -I`                      |
| 서버 이름       | `homeserver`  | 서버에서 `hostname`                         |
| Tailscale IP | `100.x.y.z`    | Tailscale 설치 후 서버에서 `tailscale ip -4` |

예를 들어 글에 `ssh 사용자명@서버IP`가 나오면, 실제로는 아래처럼 바꿔서 실행하는 식이에요.

```bash
ssh ido@192.168.0.10
```

## 시스템 업데이트하기

설치를 막 끝낸 서버에는 보안 패치며 커널 업데이트며 밀려 있는 경우가 꽤 많더라고요. 그래서 가장 먼저 패키지를 최신 상태로 만들고 한 번 재부팅해요. 모든 세팅의 출발점은 여기예요.

### 실행 명령어

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
```

재부팅이 끝나면 맥북에서 다시 SSH로 접속해요.

```bash
ssh 사용자명@서버IP
```

### 확인 방법

```bash
uname -a
uptime
```

## 내부 IP 고정하기

미니 PC의 내부 IP가 바뀌지 않도록 고정해두는 단계예요. 홈서버 IP가 어느 날 갑자기 달라지면 SSH 접속, Docker 서비스, 모니터링, 백업 설정이 한꺼번에 흔들릴 수 있거든요.

#### [ 권장 방식 ]

서버 안에서 직접 고정 IP를 설정하기보다, 공유기 관리자 페이지에서 DHCP 예약을 거는 방식을 추천해요. 서버 쪽 네트워크 설정을 건드리지 않아도 되고, 나중에 IP를 바꿀 때 공유기 한 곳에서만 관리할 수 있어서요.

```text
미니 PC MAC 주소 → 192.168.0.10
```

#### [ 실행 명령어 ]

서버에서 현재 IP를 확인해요. (IP 주소 확인)

```bash
hostname -I
```

네트워크 인터페이스와 IP를 자세히 확인해요. (MAC 주소 확인)

```bash
ip addr
```

유선 랜을 쓰고 있다면 보통 `enp...`, `eno...`처럼 시작하는 인터페이스를 보면 돼요. 공유기 DHCP 예약 화면에서는 이 인터페이스의 MAC 주소를 골라 `192.168.0.10` 같은 내부 IP를 묶어줘요.

#### [ 확인 방법 ]

잘 설정됐는지 확인하려고, 공유기에서 DHCP 예약을 걸어둔 다음 서버를 재부팅해요.

```bash
sudo reboot
```

다시 접속한 뒤 IP가 그대로인지 확인해요.

```bash
hostname -I
```

## SSH를 키로 잠그기

이번에는 SSH를 공개키 기반 접속으로 바꾸고, 비밀번호 로그인과 root 로그인은 막아둬요. SSH는 서버의 정문 같은 존재라, 여기를 어떻게 잠가두느냐가 사실상 홈서버 보안의 시작이에요. 비밀번호 로그인은 무차별 대입 공격에 노출되기 쉽고, root 로그인을 열어두면 공격이 성공했을 때 피해가 훨씬 커지거든요.

이 단계에서는 기존 SSH 창을 절대 먼저 닫지 않아요. 새 터미널에서 키 기반 접속이 되는지 확인한 다음에만 비밀번호 로그인을 막아야 해요.

#### [ 실행 명령어 ]

먼저 맥북에 SSH 키가 있는지 확인해요.

```bash
ls ~/.ssh
```

`id_ed25519.pub`가 없다면 맥북에서 새 키를 만들어요.

```bash
ssh-keygen -t ed25519
```

공개키를 서버로 복사해요.

```bash
ssh-copy-id 사용자명@서버IP
```

복사가 끝났다면 기존 SSH 창은 그대로 두고, 새 터미널을 열어 키로 접속이 되는지 먼저 확인해요.

```bash
ssh 사용자명@서버IP
```

비밀번호 없이 접속되면 다음 단계로 넘어가요. 계속 비밀번호를 묻는다면 아직 `PasswordAuthentication no`를 적용하지 말고, 공개키 복사부터 다시 확인하는 편이 안전해요.

키 접속이 확인됐다면, 서버에 접속한 상태에서 Ubuntu의 SSH 설정 드롭인 디렉터리가 활성화되어 있는지 확인해요.

```bash
grep '^Include /etc/ssh/sshd_config.d/\*.conf' /etc/ssh/sshd_config
```

출력이 없다면 `/etc/ssh/sshd_config`에 `Include /etc/ssh/sshd_config.d/*.conf`가 있는지 직접 확인해요.

```bash
sudo nano /etc/ssh/sshd_config
```

Ubuntu 기본 설정에서는 보통 아래 줄이 파일 상단에 있어요.

```text
Include /etc/ssh/sshd_config.d/*.conf
```

이 줄이 없다면 메인 파일에는 위 `Include` 줄만 추가하고, 실제 보안 설정은 아래 드롭인 파일에 둬요.

이어서 메인 설정 파일을 직접 수정하지 말고, 홈서버용 SSH 보안 설정 파일을 새로 만들어요.

```bash
sudo nano /etc/ssh/sshd_config.d/00-homeserver-hardening.conf
```

아래 내용을 넣어요.

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

설정 파일 권한을 정리해요.

```bash
sudo chown root:root /etc/ssh/sshd_config.d/00-homeserver-hardening.conf
sudo chmod 644 /etc/ssh/sshd_config.d/00-homeserver-hardening.conf
```

적용 전에 SSH 설정 문법을 검사해요.

```bash
sudo sshd -t
```

아무 출력이 없으면 정상이에요. 마지막으로 SSH 설정 변경을 반영하려고 서비스를 다시 시작해요. Ubuntu 공식 OpenSSH 문서에서도 설정 변경 후 재시작을 안내하고 있으니, 여기서는 `restart`를 사용해요.

```bash
sudo systemctl restart ssh.service
```

#### [ 확인 방법 ]

기존 SSH 창은 닫지 말고, 맥북에서 새 터미널을 열어 다시 접속해요. 새 SSH 접속이 성공하기 전까지 기존 SSH 창을 닫지 않는 게 좋아요. 설정을 잘못하면 서버 앞에 직접 가서 고쳐야 할 수도 있어요.

```bash
ssh 사용자명@서버IP
```

비밀번호 입력 없이 새 접속이 성공하면, 서버에서 실제 적용값도 확인해요.

```bash
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|pubkeyauthentication)'
```

아래처럼 나오면 의도대로 적용된 거예요.

```text
permitrootlogin no
pubkeyauthentication yes
passwordauthentication no
```

여기까지 확인한 뒤에 기존 창을 닫아도 돼요.

## 방화벽 켜기

이번에는 `ufw`를 켜서 SSH만 열어두는 단순한 방화벽 구성을 만들어요. 어떤 포트가 열려 있는지조차 모르는 서버만큼 마음 불편한 것도 없더라고요. 처음에는 SSH 말고는 모두 닫아두는 편이 훨씬 마음이 편해요.

처음에는 `OpenSSH`를 허용한 뒤 방화벽을 켜요. 나중에 Tailscale 접속이 확인되면 일반 SSH 허용 규칙은 지우고, Tailscale 인터페이스만 허용하도록 더 좁힐 거예요.

순서가 중요해요. `ufw enable`을 먼저 실행하면 SSH 허용 규칙이 없는 상태로 방화벽이 켜져 SSH 세션이 그 자리에서 끊길 수 있어요. 반드시 `ufw allow OpenSSH`를 먼저 실행한 뒤에 `ufw enable`을 하는 순서로 진행해요.

#### [ 실행 명령어 ]

```bash
sudo ufw allow OpenSSH
sudo ufw enable
```

#### [ 확인 방법 ]

```bash
sudo ufw status verbose
```

`Status: active`와 `OpenSSH ALLOW IN`이 보이면 우선은 정상이에요. 이 상태는 내부망에서 SSH로 접속할 수 있게 남겨두는 안전한 중간 단계예요.

## 보안 업데이트 자동화하기

보안 업데이트가 자동으로 적용되도록 설정해두는 단계예요. 홈서버는 매일 직접 들여다보지 않을 가능성이 높잖아요. 그러니 최소한의 보안 패치만큼은 자동화에 맡겨두는 편이 마음이 놓여요.

Ubuntu Server에는 `unattended-upgrades`가 기본으로 깔려 있는 경우가 많아요. 아래 설치 명령이 "이미 최신 버전"이라고 나와도 정상이에요. 설치 여부보다 우리가 직접 챙겨야 하는 건 자동 실행 설정이에요.

#### [ 실행 명령어 ]

```bash
sudo apt install unattended-upgrades -y
```

자동 업데이트 설정은 apt의 드롭인 디렉터리에 별도 설정 파일로 둬요.

```bash
sudo nano /etc/apt/apt.conf.d/20auto-upgrades
```

아래 내용을 넣어요.

```text
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

파일 권한을 정리해요.

```bash
sudo chown root:root /etc/apt/apt.conf.d/20auto-upgrades
sudo chmod 644 /etc/apt/apt.conf.d/20auto-upgrades
```

#### [ 확인 방법 ]

```bash
systemctl status unattended-upgrades
apt-config dump APT::Periodic
systemctl status apt-daily.timer apt-daily-upgrade.timer
ls -la /var/log/unattended-upgrades/
```

`APT::Periodic::Update-Package-Lists "1";`와 `APT::Periodic::Unattended-Upgrade "1";`가 보이고, `apt-daily.timer`와 `apt-daily-upgrade.timer`가 잡혀 있으면 자동 실행 경로가 준비된 거예요. 실제 실행 기록은 `/var/log/unattended-upgrades/` 아래 로그에서 확인할 수 있어요.

#### [ 주의할 점 ]

자동 보안 업데이트는 말 그대로 기본 방어선이에요. 모든 운영을 대신해주지는 않아요. 중요한 서비스는 로그와 상태 확인도 같이 챙겨주세요.

## 서버 시간 맞추기

서버 시간을 한국 시간으로 맞추고 NTP 동기화도 같이 확인해요. 시간이 한 번 틀어지기 시작하면 로그 분석, 인증서, 스케줄러, 백업 시간이 한꺼번에 헷갈리거든요.

#### [ 실행 명령어 ]

```bash
sudo timedatectl set-timezone Asia/Seoul
```

#### [ 확인 방법 ]

```bash
timedatectl
```

아래 항목을 확인해요.

```text
Time zone: Asia/Seoul
System clock synchronized: yes
NTP service: active
```

## sudo 권한 확인하기

도구 설치, 디렉터리 생성처럼 이어지는 단계는 대부분 sudo 권한이 필요해요. 다음 작업으로 넘어가기 전에, 지금 사용자가 sudo 권한을 가지고 있는지 한 번 확인해요. root로 직접 로그인하기보다 일반 사용자로 접속한 뒤 필요한 작업만 sudo로 실행하는 편이 안전하거든요.

#### [ 실행 명령어 ]

```bash
groups
```

출력에 `sudo`가 있으면 돼요.

예:

```text
ido sudo users
```

#### [ sudo 권한이 없을 때 ]

sudo 권한이 있는 다른 계정에서 실행해요.

```bash
sudo usermod -aG sudo 사용자명
```

변경 후 다시 로그인해야 반영돼요.

## 관리 도구 설치하기

서버 관리에 자주 쓰는 기본 도구를 같이 설치해둬요. 문제가 생겼을 때 CPU, 메모리, 디스크, 네트워크, DNS, 로그를 바로 들여다볼 수 있어야 그나마 마음이 놓이더라고요.

| 도구               | 하는 일                                  | 홈서버에서 쓰는 상황                            | 설치 |
| ----------------- | -------------------------------------- | ------------------------------------------ | --- |
| `curl`            | URL로 HTTP 요청을 보내거나 파일을 다운로드      | API 테스트, 설치 스크립트 실행, 서버 응답 확인      | 필수 |
| `ca-certificates` | 신뢰할 CA 인증서 묶음                       | HTTPS 접속, 패키지 저장소, Docker/Git 인증서 검증 | 필수 |
| `gnupg`           | GPG 키/서명 검증 도구                      | 외부 apt 저장소 키 등록, 패키지 서명 검증           | 필수 |
| `git`             | Git 저장소 clone/pull/commit 관리         | 프로젝트 코드 배포, 설정 파일 버전 관리             | 추천 |
| `htop`            | CPU/메모리/프로세스 상태를 보는 TUI 도구       | 서버가 느릴 때 어떤 프로세스가 문제인지 확인          | 추천 |
| `tmux`            | 터미널 세션 유지/분할 도구                   | SSH가 끊겨도 작업 계속 유지                      | 추천 |

#### [ 실행 명령어 ]

먼저 기본 도구만 설치해요.

```bash
sudo apt install -y curl ca-certificates gnupg git tmux htop
```

원한다면 선택 도구도 함께 설치해요.

```bash
sudo apt install -y wget btop dnsutils unzip lsb-release vim net-tools
```

#### [ 확인 방법 ]

CPU와 메모리 상태:

```bash
htop
```

디스크 용량:

```bash
df -h
```

메모리:

```bash
free -h
```

실패한 서비스:

```bash
systemctl --failed
```

최근 시스템 로그:

```bash
journalctl -xe
```

SSH 로그:

```bash
sudo journalctl -u ssh
```

## `/srv` 디렉터리 구성하기

이번에는 서비스, 데이터, 백업, 로그를 둘 기본 디렉터리를 만들어요. 파일이 여기저기 흩어지고 나면 나중에 백업과 복구가 정말 까다로워지더라고요. Docker를 쓰기 전부터 기준 위치를 잡아두는 게 마음 편해요. 나만 쓰는 서버라도 Docker 컨테이너와 데이터베이스가 돌기 시작하면, 그 파일들은 개인 문서라기보다 서버 운영 파일에 가까워지거든요. 그래서 개인 작업 공간인 `/home/사용자명`과 운영 서비스 공간인 `/srv`를 처음부터 구분해두는 편이 좋아요.

#### [ 실행 명령어 ]

```bash
sudo mkdir -p /srv/docker /srv/data /srv/backups /srv/logs
sudo chown -R $USER:$USER /srv/docker /srv/data /srv/backups /srv/logs
```

#### [ 확인 방법 ]

방금 만든 폴더는 현재 디렉터리가 아니라 루트 아래 `/srv`에 만들어져요. 그냥 `ls`만 치면 현재 디렉터리만 보이니까, 아래처럼 확인해요.

```bash
ls -la /srv
```

#### [ 디렉터리 의미 ]

```text
/srv/docker   # Docker Compose 파일 위치
/srv/data     # 서비스 데이터 위치
/srv/backups  # 백업 파일 위치
/srv/logs     # 별도 로그 위치
```

#### [ 왜 하필 `/srv` 아래일까 ]

리눅스에서 `/srv`는 이 서버가 제공하는 서비스 데이터를 두는 위치로 쓰기 좋아요.

```text
/home/사용자명   # 개인 작업 공간
/srv           # 서버가 제공하는 서비스 운영 공간
/opt           # 독립 애플리케이션 설치 위치
/var/lib       # 패키지나 시스템 서비스의 상태 데이터
/var/log       # 시스템 로그
```

따라서 홈서버에서는 다음처럼 역할을 나누는 게 깔끔해요.

```text
/home/ido/projects   # 내가 개발하거나 실험하는 소스코드
/srv/docker          # 서버에서 실제 실행하는 Docker Compose 설정
/srv/data            # 컨테이너가 운영 중 저장하는 영구 데이터
/srv/backups         # 백업 결과물
/srv/logs            # 별도로 모아둘 로그
```

#### [ 서비스가 여러 개로 늘어나면 ]

`/srv/docker`, `/srv/data`, `/srv/backups`, `/srv/logs`는 최상위 분류예요. 실제 서비스를 추가할 때는 그 아래에 서비스별 폴더를 만들어요.

```text
/srv
├── docker/
│   ├── postgres/
│   │   ├── docker-compose.yml
│   │   └── .env
│   ├── grafana/
│   │   ├── docker-compose.yml
│   │   └── .env
│   └── minio/
│       ├── docker-compose.yml
│       └── .env
├── data/
│   ├── postgres/
│   ├── grafana/
│   └── minio/
├── backups/
│   ├── postgres/
│   ├── grafana/
│   └── minio/
└── logs/
    ├── postgres/
    ├── grafana/
    └── minio/
```

모든 서비스가 `/srv/data`, `/srv/backups`, `/srv/logs`를 다 필요로 하지는 않아요.

```text
/srv/docker/서비스명   # 모든 Docker 서비스에 권장
/srv/data/서비스명     # 영구 데이터가 있는 서비스에 사용
/srv/backups/서비스명  # 백업 대상인 서비스에 사용
/srv/logs/서비스명     # 파일 로그를 따로 남길 때 사용
```

#### [ 주의할 점 ]

Docker를 설치하기 전이라도 이 구조를 먼저 잡아두면 이후 서비스 운영이 훨씬 깔끔해져요.

물론 `/home/ido/server`처럼 홈 디렉터리 아래에 운영 폴더를 두는 것도 틀린 방식은 아니에요. 학습이나 실험 위주라면 충분히 가능해요. 다만 장기적으로 Docker 서비스, 데이터, 백업, 자동 실행, 모니터링을 붙일 계획이라면 `/srv` 아래에 두는 편이 서버 운영 관례에 더 잘 맞아요.

## Tailscale로 접속 좁히기

홈서버와 맥북을 같은 Tailscale 네트워크에 연결해서, 집 밖에서도 Tailscale IP나 MagicDNS 이름으로 SSH 접속할 수 있게 만들어요. 홈서버를 인터넷에 직접 노출하면 어쩔 수 없이 공격 대상이 되어버리는데, Tailscale을 쓰면 공유기 포트포워딩 없이도 내 장비끼리 사설 VPN처럼 안전하게 접속할 수 있어서 마음이 한결 편해져요.

여기서 설정하는 건 Tailscale의 별도 "Tailscale SSH" 기능이 아니에요. 기존 OpenSSH 서버는 그대로 두고, 접속 경로만 Tailscale 네트워크의 `100.x.y.z` IP나 MagicDNS 이름으로 바꾸는 방식이에요.

이 글에서는 `tailscale up --ssh` 옵션을 일부러 쓰지 않았어요. 이미 OpenSSH를 키 기반으로 잠가뒀고, 권한 관리는 시스템 사용자 계정과 SSH 키로 일관되게 가져가는 편이 단순해서요. Tailscale SSH는 ACL 기반 접근 제어가 필요하거나 키 관리를 Tailscale에 맡기고 싶을 때 따로 검토해도 늦지 않아요.

#### [ 기본 구조 ]

- **집 안 초기 설정**: 내부 IP 또는 Tailscale IP로 일반 SSH 접속
- **최종 권장 운영**: Tailscale IP 또는 MagicDNS 이름으로 일반 SSH 접속
- **집 밖**: Tailscale IP 또는 MagicDNS 이름으로 일반 SSH 접속
- **공유기 포트포워딩**: 하지 않음
- **SSH 인터넷 직접 공개**: 하지 않음


#### [ 실행 명령어 ]

먼저 맥북에 Tailscale 앱을 설치하고 로그인해요.

- 공식 다운로드 페이지: <https://tailscale.com/download>

<br>

맥북 쪽 준비가 끝났다면 홈서버에서 Tailscale을 설치해요.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

홈서버를 내 Tailscale 네트워크에 연결해요.

```bash
sudo tailscale up --hostname=homeserver
```

명령 실행 후 표시되는 로그인 URL을 맥북 브라우저에서 열고 인증해요.

#### [ 확인 방법 ]

홈서버에서 Tailscale 상태를 확인해요.

```bash
tailscale status
tailscale ip -4
```

`tailscale ip -4`는 보통 `100.x.y.z` 형태의 Tailscale IP를 보여줘요.

맥북에서 홈서버의 Tailscale IP로 SSH 접속을 테스트해요.

```bash
ssh 사용자명@100.x.y.z
```

Tailscale MagicDNS가 켜져 있다면 이름으로도 접속할 수 있어요.

```bash
ssh 사용자명@homeserver
```

MagicDNS는 Tailscale 관리자 화면에서 켜고 끌 수 있어요. -> <https://login.tailscale.com/admin/dns>

#### [ UFW와 함께 한 번 더 좁히기 ]

앞 단계에서 `ufw allow OpenSSH`를 설정했다면, SSH는 일반 네트워크 인터페이스에서도 허용된 상태예요. 공유기 포트포워딩을 하지 않으면 보통 인터넷에 직접 노출되지는 않지만, 더 깔끔한 구조는 SSH를 Tailscale 경유로만 허용하는 거예요.

먼저 기존 SSH 세션은 닫지 말고, 맥북에서 새 터미널을 열어 Tailscale IP로 SSH 접속이 되는지 확인해요.

```bash
ssh 사용자명@100.x.y.z
```

Tailscale IP를 통한 일반 SSH 접속이 성공하면, 홈서버에서 Tailscale 인터페이스의 SSH 포트만 허용해요.

```bash
sudo ufw allow in on tailscale0 to any port 22 proto tcp
```

접속이 확인되면 일반 SSH 허용 규칙을 제거해요.

```bash
sudo ufw delete allow OpenSSH
sudo ufw reload
```

상태를 확인해요.

```bash
sudo ufw status verbose
```

예상되는 핵심 규칙:

```text
22/tcp on tailscale0 ALLOW IN Anywhere
```

이제 SSH는 Tailscale 네트워크로 접속한 장비에서만 가능해져요. 이 상태에서는 내부망 IP로 아래처럼 접속하는 명령이 실패하는 게 정상이에요.

```bash
ssh 사용자명@서버IP
```

내부망에서도 Tailscale 없이 SSH를 계속 열어두고 싶다면 일반 `OpenSSH` 전체 허용 대신, 집 네트워크 대역만 좁게 허용하는 식으로 선택할 수 있어요. 예를 들어 집 LAN이 `192.168.0.0/24`라면 아래처럼 둘 수 있어요.

```bash
sudo ufw allow from 192.168.0.0/24 to any port 22 proto tcp
```

이 글에서는 공격 표면을 줄이기 위해 기본값을 Tailscale-only SSH로 잡아요. 나중에 다른 서비스를 Tailscale 안에서 열고 싶다면, 그 서비스 포트를 별도 규칙으로 추가하면 돼요.

#### [ 주의할 점 ]

- 공유기에서 SSH 22번 포트를 포트포워딩하지 않아요.
- Tailscale IP로 SSH 접속이 되는지 확인하기 전에는 기존 SSH 접속 창을 닫지 않아요.

이 글에서 쓰는 일반 tailnet 접속 방식은 공개 웹 서비스 노출 구성이 아니에요. 같은 tailnet에 로그인된 내 장비끼리 연결하는 사설 네트워크라고 생각하면 돼요. 공개 웹 서비스를 열고 싶다면 Tailscale Funnel 같은 별도 기능을 따로 검토해야 해요.

서버 장비는 장기간 켜둘 가능성이 높으니까, Tailscale 관리자 화면에서 해당 장비의 key expiry를 꺼둘지 검토해요. 다만 만료를 끄면 편해지는 대신, 장비 접근 권한 관리를 더 신중히 해야 해요.

공식 참고 문서:

- <https://tailscale.com/docs/install>
- <https://tailscale.com/docs/how-to/secure-ubuntu-server-with-ufw>
- <https://tailscale.com/docs/reference/faq/firewall-ports>

## (선택) fail2ban 한 겹 더

SSH 로그인 공격을 한 번 더 걸러두려고 `fail2ban`을 설치해요. SSH가 외부에 노출돼 있을 때 반복적인 로그인 시도를 자동으로 차단해주는 도구예요.

앞 섹션에서 UFW 규칙을 `tailscale0` 인터페이스로만 좁혔다면 SSH는 사실상 Tailscale 안에서만 도달 가능한 상태예요. 그래서 fail2ban의 효용은 크지 않아 옵션이라고 표시했어요. 반대로 어떤 이유로 일반 SSH 허용 규칙을 다시 열어야 한다면, 이 단계는 한 겹의 안전망으로 의미가 커져요.

#### [ 실행 명령어 ]

```bash
sudo apt install fail2ban -y
```

기본 설정 파일인 `/etc/fail2ban/jail.conf`는 직접 수정하지 않고, SSH용 로컬 설정 파일을 별도로 만들어요.

```bash
sudo nano /etc/fail2ban/jail.d/sshd.local
```

아래 내용을 넣어요.

| 설정                 | 의미                                 |
| ------------------- | ---------------------------------- |
| `enabled = true`    | `sshd` 감시 규칙을 켜요.             |
| `backend = systemd` | SSH 로그를 systemd journal에서 읽어요.  |
| `maxretry = 5`      | 허용할 로그인 실패 횟수는 최대 5번이에요.    |
| `findtime = 10m`    | 10분 안에 실패 횟수를 세요.              |
| `bantime = 1h`      | 조건을 넘긴 IP를 1시간 동안 차단해요.      |

```ini
[sshd]
enabled = true
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
```

파일 권한을 정리해요.

```bash
sudo chown root:root /etc/fail2ban/jail.d/sshd.local
sudo chmod 644 /etc/fail2ban/jail.d/sshd.local
```

fail2ban을 다시 시작해요.

```bash
sudo systemctl restart fail2ban
```

#### [ 확인 방법 ]

```bash
sudo systemctl status fail2ban
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

#### [ 주의할 점 ]

`/etc/fail2ban/jail.conf`는 패키지가 제공하는 기본 예시와 기본값에 가까워요. 내 서버의 운영 설정은 `/etc/fail2ban/jail.d/*.local`에 두는 편이 관리하기 좋아요.

## (선택) 디스크 상태 확인하기

SSD나 HDD 상태를 가끔이라도 확인할 수 있도록 SMART 도구도 같이 설치해둬요. 디스크는 결국 언젠가는 고장 나기 마련이라, 홈서버에서 데이터가 중요해질수록 상태 확인과 백업은 점점 필수에 가까워지더라고요.

#### [ 실행 명령어 ]

```bash
sudo apt install smartmontools -y
```

디스크 목록 확인:

디스크 이름은 서버마다 달라요. `lsblk`로 실제 디스크 이름을 확인한 뒤 `smartctl` 명령어를 실행해요.

```bash
lsblk
```

NVMe SSD 예시:

```bash
sudo smartctl -a /dev/nvme0n1
```

SATA SSD/HDD 예시:

```bash
sudo smartctl -a /dev/sda
```

#### [ 확인 방법 ]

출력에서 건강 상태, 에러 로그, 사용 시간 등을 확인해요.

## 마지막 점검

여기까지 따라왔다면 기본 세팅은 거의 다 마친 셈이에요. 마지막으로 한 번 재부팅하고, 처음부터 끝까지 잘 잡혀 있는지 같이 훑어볼게요.

```bash
sudo reboot
```

UFW를 아직 Tailscale-only로 좁히지 않았거나, LAN 대역을 따로 허용했다면 내부 IP로 접속할 수 있어요.

```bash
ssh 사용자명@서버IP
```

권장 흐름대로 Tailscale만으로 SSH를 허용하도록 UFW를 정리했다면, Tailscale IP나 MagicDNS 이름으로 접속해요.

```bash
ssh 사용자명@100.x.y.z
ssh 사용자명@homeserver
```

아래 명령어로 상태를 한 번에 확인해요.

```bash
hostname
timedatectl
sudo ufw status verbose
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|pubkeyauthentication)'
systemctl status ssh
systemctl status unattended-upgrades
apt-config dump APT::Periodic
systemctl status apt-daily.timer apt-daily-upgrade.timer
ls -la /var/log/unattended-upgrades/
systemctl --failed
tailscale status
tailscale ip -4
df -h
free -h
```

### 완료 체크리스트

아래 항목이 만족되면 기본 홈서버 세팅 1차 완료로 볼 수 있어요.

| 항목                              | 확인 방법                                                                                    | 정상 기준                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Ubuntu 패키지를 업데이트했다.         | `sudo apt update`                                                                          | 업그레이드 가능한 패키지가 없거나 적게 표시된다.                                          |
| 서버 이름을 정했다.                  | `hostname`                                                                                 | `homeserver`처럼 내가 정한 이름이 나온다.                                            |
| 내부 IP가 고정되어 있다.              | `hostname -I`                                                                              | 재부팅 후에도 같은 `192.168.x.x` 주소가 나온다.                                       |
| 초기 설정 중 내부망 SSH 접속을 확인했다. | 맥북에서 `ssh 사용자명@서버IP`                                                                   | Tailscale-only로 좁히기 전 SSH 키로 정상 접속된다.                                   |
| Tailscale 경유 SSH 접속이 된다.      | 맥북에서 `ssh 사용자명@100.x.y.z` 또는 `ssh 사용자명@homeserver`                                   | Tailscale 네트워크를 통해 정상 접속된다.                                             |
| SSH 설정 파일이 분리되어 있다.         | `ls -l /etc/ssh/sshd_config.d/00-homeserver-hardening.conf`                                | 파일이 존재한다.                                                                  |
| SSH 설정 문법이 정상이다.             | `sudo sshd -t`                                                                             | 아무 출력이 없다.                                                                 |
| SSH 비밀번호/root 로그인이 막혀 있다.  | `sudo sshd -T`                                                                             | `passwordauthentication no`, `permitrootlogin no`가 나온다.                      |
| UFW 방화벽이 켜져 있다.              | `sudo ufw status verbose`                                                                  | `Status: active`가 나온다.                                                       |
| SSH가 Tailscale 경유로만 허용된다.   | `sudo ufw status verbose`                                                                   | `22/tcp on tailscale0` 허용 규칙이 있고 일반 `OpenSSH` 허용 규칙은 없다.               |
| 자동 보안 업데이트가 켜져 있다.        | `apt-config dump APT::Periodic`, `systemctl status apt-daily.timer apt-daily-upgrade.timer` | `Update-Package-Lists`와 `Unattended-Upgrade`가 `1`이고 관련 타이머가 잡혀 있다.      |
| 타임존과 시간 동기화가 맞다.           | `timedatectl`                                                                               | `Asia/Seoul`, `System clock synchronized: yes`, `NTP service: active`가 나온다. |
| 기본 관리 도구가 설치되어 있다.        | `dpkg -s curl ca-certificates gnupg git tmux htop`                                          | 각 패키지에 `Status: install ok installed`가 나온다.                               |
| 현재 사용자가 sudo 권한을 가지고 있다.  | `groups`                                                                                    | 출력에 `sudo`가 포함된다.                                                         |
| 운영 디렉터리를 만들었다.             | `ls -ld /srv/docker /srv/data /srv/backups /srv/logs`                                       | 디렉터리가 존재하고 내 사용자 소유다.                                                  |
| 맥북과 홈서버가 같은 tailnet에 있다.   | 홈서버에서 `tailscale status`                                                                  | 맥북과 홈서버가 함께 보인다.                                                        |
| 홈서버의 Tailscale IP를 확인했다.    | `tailscale ip -4`                                                                            | `100.x.y.z` 형태의 IP가 나온다.                                                  |
| SSH 포트포워딩을 하지 않는다.         | 공유기 포트포워딩/NAT/가상 서버 메뉴                                                                 | 외부 22 또는 2222 등에서 홈서버 22번으로 가는 규칙이 없다.                              |

## 마치며

여기까지가 제 홈서버의 첫 번째 골격이에요. 이 기본 세팅이 한 번 잡히고 나면, 그 다음은 비교적 자연스럽게 가지를 뻗어갈 수 있더라고요.

처음에는 저도 'Docker만 빨리 깔고 서비스 올리면 되지 않나' 싶은 마음이었는데, 막상 해보니 욕심내서 많은 걸 한꺼번에 올리는 것보다 기본 운영 골격을 먼저 단단히 잡아두는 편이 훨씬 마음 편하다는 걸 새삼 느꼈어요.

결국 홈서버는 "앱을 많이 띄운 PC"라기보다는, **접근 제어, 업데이트, 방화벽, 상태 확인, 디렉터리 구조, 백업 원칙이 잡힌 작은 운영 인프라**에 더 가까운 것 같아요.

비슷한 환경에서 홈서버를 시작해보려는 분께, 이 글이 작은 길잡이가 되었으면 좋겠어요.
