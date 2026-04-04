import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistrationClosedModal from "@/components/RegistrationClosedModal";
import { isRegistrationClosed } from "@/data/helpers";

type RegisterActionProps = {
  eventId?: string;
  timeText?: string;
  registrationClosed?: boolean;
  coordinatorName?: string;
  coordinatorPhone?: string;
  className: string;
  label?: string;
};

const RegisterAction = ({ eventId, timeText, registrationClosed, coordinatorName, coordinatorPhone, className, label = "Register Now" }: RegisterActionProps) => {
  const navigate = useNavigate();
  const [showClosedPopup, setShowClosedPopup] = useState(false);
  const isClosed = isRegistrationClosed(timeText, new Date(), Boolean(registrationClosed));

  useEffect(() => {
    if (isClosed) {
      setShowClosedPopup(true);
    }
  }, [isClosed]);

  function handleClick() {
    if (isClosed) {
      setShowClosedPopup(true);
      return;
    }

    navigate(eventId ? `/register?eventId=${eventId}` : "/register");
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className} disabled={isClosed}>
        {isClosed ? "Registration Closed" : label}
      </button>
      <RegistrationClosedModal
        open={showClosedPopup}
        onClose={() => setShowClosedPopup(false)}
        coordinatorName={coordinatorName}
        coordinatorPhone={coordinatorPhone}
      />
    </>
  );
};

export default RegisterAction;
