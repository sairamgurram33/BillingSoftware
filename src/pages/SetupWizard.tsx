import React, { useState } from 'react';
import './SetupWizard.css';

interface SetupWizardProps {
  onComplete: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [shopData, setShopData] = useState({
    shopName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
  });
  const [adminData, setAdminData] = useState({
    username: 'admin',
    password: '',
    firstName: 'Admin',
  });

  const handleShopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShopData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    // Setup logic will be implemented in Phase 1
    onComplete();
  };

  return (
    <div className="setup-wizard">
      <div className="setup-progress">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`progress-step ${step >= i ? 'active' : ''}`}>
            {i}
          </div>
        ))}
      </div>

      <div className="setup-content">
        {step === 1 && (
          <div className="setup-form">
            <h2>Shop Information</h2>
            <input
              type="text"
              name="shopName"
              placeholder="Shop Name"
              value={shopData.shopName}
              onChange={handleShopChange}
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={shopData.address}
              onChange={handleShopChange}
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={shopData.phone}
              onChange={handleShopChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={shopData.email}
              onChange={handleShopChange}
            />
            <input
              type="text"
              name="gstNumber"
              placeholder="GST Number"
              value={shopData.gstNumber}
              onChange={handleShopChange}
            />
          </div>
        )}

        {step === 2 && (
          <div className="setup-form">
            <h2>Create Admin Account</h2>
            <input
              type="text"
              placeholder="Username"
              value={adminData.username}
              disabled
            />
            <input
              type="password"
              placeholder="Password"
              value={adminData.password}
              onChange={(e) =>
                setAdminData((prev) => ({ ...prev, password: e.target.value }))
              }
            />
            <input
              type="text"
              placeholder="First Name"
              value={adminData.firstName}
              onChange={(e) =>
                setAdminData((prev) => ({ ...prev, firstName: e.target.value }))
              }
            />
          </div>
        )}

        {step === 3 && (
          <div className="setup-form">
            <h2>Database Configuration</h2>
            <p>Ensure MySQL is installed and running.</p>
            <p>Default connection: localhost:3306</p>
          </div>
        )}

        {step === 4 && (
          <div className="setup-form">
            <h2>Printer Configuration</h2>
            <p>Configure your thermal printer in the settings later.</p>
          </div>
        )}

        {step === 5 && (
          <div className="setup-form">
            <h2>Setup Complete</h2>
            <p>Your SmartShop POS is ready to use!</p>
          </div>
        )}
      </div>

      <div className="setup-buttons">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="btn-secondary"
        >
          Previous
        </button>
        <button onClick={handleNext} disabled={step === 5} className="btn-primary">
          Next
        </button>
        {step === 5 && (
          <button onClick={handleFinish} className="btn-success">
            Start Using SmartShop
          </button>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
