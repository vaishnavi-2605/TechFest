import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistrationClosedModal from "@/components/RegistrationClosedModal";
import { isRegistrationClosed } from "@/data/helpers";

type RegisterActionProps = {
  eventId?: string;
  timeText?: string;
  className: string;
  label?: string;
};

const RegisterAction = ({ eventId, timeText, className, label = "Register Now" }: RegisterActionProps) => {
  const navigate = useNavigate();
  const [showClosedPopup, setShowClosedPopup] = useState(false);

  function handleClick() {
    if (isRegistrationClosed(timeText)) {
      setShowClosedPopup(true);
      return;
    }

    navigate(eventId ? `/register?eventId=${eventId}` : "/register");
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        {label}
      </button>
      <RegistrationClosedModal open={showClosedPopup} onClose={() => setShowClosedPopup(false)} />
    </>
  );
};

export default RegisterAction;
