# Theo doi bao cao THCS & THPT Doc Binh Kieu

## Chay du an tren Windows

Yeu cau: Node.js 20 tro len. Repo hien co `bun.lock`, nhung may nay dang dung npm; khong tron hai package manager trong cung mot lan cai dat.

```powershell
cd D:\THIETKEPHANMEM\THEO_DOI_BAO_CAO
npm install --no-package-lock
npm run dev
```

Mo `http://localhost:3000`. Kiem tra server:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/health
```

Ket qua dung la JSON co `status: "ok"`.

Kiem tra truoc khi day code:

```powershell
npm run lint
npm run build
```

Dung `Ctrl+C` de dung server dev.

## Bien moi truong

- `.env.example` chi la mau. Tao `.env.local` neu tinh nang can Gemini:

```env
GEMINI_API_KEY=dat-khoa-cua-ban-o-day
```

- Khong commit `.env.local`, API key, mat khau, hoac token.
- Firebase web config duoc nap tu `firebase-applet-config.json` va/hoac cau hinh trong ung dung. Khong tu y doi project Firebase khi chua sao luu du lieu.

## Quy trinh lam viec giua VS Code va AI Studio

GitHub la noi lam viec chung duy nhat. Moi cong cu chi duoc sua sau khi cong cu kia da day code len GitHub.

### Khi bat dau sua bang VS Code

```powershell
git status
git pull --rebase origin main
npm install --no-package-lock
```

Neu `git status` cho thay file dang sua ma ban khong phai nguoi sua, dung lai va kiem tra truoc khi viet tiep.

### Khi ket thuc mot lan sua bang VS Code

```powershell
npm run lint
npm run build
git add -A
git commit -m "Mo ta ngan gon thay doi"
git push origin main
```

Khong dung `git add -A` neu thu muc `data/` co du lieu nhay cam hoac du lieu chua muon day len GitHub. Khi do, add tung file code can thiet va kiem tra `git diff --cached` truoc commit.

### Khi quay lai AI Studio

1. Dung server VS Code neu khong con lam viec.
2. Dam bao commit da duoc `git push origin main`.
3. Trong AI Studio, dong workspace cu hoac thuc hien thao tac Pull/Sync tu GitHub.
4. Xac nhan workspace AI Studio dang o commit moi nhat tren nhanh `main`.
5. Chi bat dau yeu cau AI sua code sau khi da dong bo xong.
6. Khi AI Studio sua xong, commit va push thay doi len GitHub truoc khi quay lai VS Code.

Neu AI Studio khong co thao tac Pull/Sync, hay mo lai project tu repository GitHub moi nhat. Khong tai mot ban ZIP cu de tiep tuc, vi ban do co the ghi de thay doi moi.

## Xu ly xung dot Git

Neu `git pull --rebase origin main` bao conflict:

```powershell
git status
```

Mo cac file co dau `<<<<<<<`, `=======`, `>>>>>>>`, giu lai noi dung dung, xoa dau danh dau, sau do:

```powershell
git add <file-da-giai-quyet>
git rebase --continue
npm run lint
npm run build
git push origin main
```

Khong sua cung mot file tren VS Code va AI Studio cung luc. Neu khong chac ban nao la moi nhat, dung lai va xem `git log --oneline --decorate -10` truoc khi chon noi dung.

## Luu y du lieu

Ung dung co du lieu local trong thu muc `data/` va co dong bo Firebase. Truoc khi sua logic dong bo, hay sao luu cac file du lieu va kiem tra tren tai khoan test. Khong dung `git reset --hard` de xu ly loi khi chua sao luu thay doi.
