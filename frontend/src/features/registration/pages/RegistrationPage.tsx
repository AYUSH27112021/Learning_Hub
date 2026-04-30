import { Link } from "react-router-dom";
import RegistrationForm from "../components/RegistrationForm";

export default function RegistrationPage() {
  return (
    <div className="reg-page">
      <div className="reg-page-header">
        <div className="reg-page-header-inner">
          <Link to="/" className="reg-back-link">← Back to Home</Link>
          <h1 className="reg-page-title">Student Registration</h1>
          <p className="reg-page-sub">
            Fill in the details below to enrol at Learning Hub. All fields marked <span className="reg-req">*</span> are required.
          </p>
        </div>
      </div>

      <div className="reg-page-body">
        <div className="reg-page-body-inner">
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
}
