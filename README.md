# Learning Hub

Basic full-stack setup for:
- Public landing website
- Registration form (saved in SQLite)
- Private admin panel (email/password login)
- S3-based image uploads with key_name mapping

## Project Structure

- `frontend`: React + Vite app
- `backend`: Express + SQLite API

## Run Locally

1. Backend env:
   - copy `backend/.env.example` to `backend/.env`
   - set AWS credentials and bucket for image upload
2. Install and run:
   - `npm install`
   - `npm run dev --prefix backend`
   - `npm run dev --prefix frontend`

Default seeded admin:
- email: `admin@learninghub.local`
- password: `admin123`

div className="lp-brand-tagline">
                An Institute for IIT-JEE &nbsp;|&nbsp; NEET &nbsp;|&nbsp; Foundation &nbsp;|&nbsp;
                KVPT &nbsp;|&nbsp; NTSE &nbsp;|&nbsp; Olympiad &nbsp;|&nbsp; School Exam &nbsp;|&nbsp; Board Exams
              </div>