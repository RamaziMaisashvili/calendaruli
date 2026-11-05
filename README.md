# სასწავლო რესურსების მართვის სისტემა (calendar.learn.net.ge)
# ახალი ატვირთვის ლოგი ცარიელი ეკრანიდან
sudo journalctl -u api_site -n 0 -f -o cat

# ბოლო 150 ჩანაწერის თავიდან სანახავად გაუშვი
sudo journalctl -u api_site -n 150 --no-pager -o cat 
სისტემა განკუთვნილია სასწავლო რესურსების მართვისა და ფაილების (DOCX, XLSX, PDF, JSON და სხვ.) პითონით დამუშავებისათვის.
SET FOREIGN_KEY_CHECKS=0;

TRUNCATE TABLE `curriculum_outcomes`;

SET FOREIGN_KEY_CHECKS=1;
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `curriculum_modules`;
SET FOREIGN_KEY_CHECKS=1;
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `curriculum_plans`;
SET FOREIGN_KEY_CHECKS=1;
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `uploaded_files`;

SET FOREIGN_KEY_CHECKS=1;
## მისამართები:
- **Frontend (React)**: `https://calendar.learn.net.ge/`
- **Backend (Python / FastAPI / MySQL)**: `https://api.learn.net.ge/`

---

## 3 ტიპის მომხმარებელი და უფლებები:

| მომხმარებელი | როლი (`role`) | პაროლი | უფლებები |
| :--- | :--- | :--- | :--- |
| **admin** | `admin` (ადმინისტრატორი) | `admin123` | **ყველა უფლება:** ატვირთვა, ყველა ფაილის ნახვა/დამუშავება, ჩამოტვირთვა, წაშლა |
| **teacher** | `teacher` (მასწავლებელი) | `teacher123` | **მხოლოდ საკუთარი რესურსის დათვალიერება:** ატვირთვა, მხოლოდ საკუთარი ფაილების სია და ჩამოტვირთვა |
| **student** | `student` (სტუდენტი) | `student123` | **მხოლოდ დათვალიერება:** რესურსების სიის ნახვა და ჩამოტვირთვა. ატვირთვა და წაშლა შეზღუდულია |

---

## მონაცემთა ბაზის იმპორტი (MySQL)
ფაილი: [`calendar_learn.sql`](calendar_learn.sql)

```bash
mysql -u root -p < calendar_learn.sql
```
ან შეიტანეთ phpMyAdmin-ის საშუალებით ბაზაში: `api_site_calendar_api`.

---

## 1. Backend (Python API) გაშვება
საქაღალდე: `backend`

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 2. Frontend (React + Vite) გაშვება
საქაღალდე: `frontend`

```bash
cd frontend
npm install
npm run dev
```

Production Build:
```bash
cd frontend
npm run build
```
შედეგი განთავსდება `frontend/dist` საქაღალდეში.
