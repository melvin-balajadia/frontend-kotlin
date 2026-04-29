import { useLogout } from "@/hooks/auth/auth.hooks";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  const { mutate: logout, isPending, isError, error } = useLogout();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logout(undefined, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <button
        className="bg-blue-500 text-white text-xs py-1 rounded px-2.5 hover:cursor-pointer"
        onClick={handleSubmit}
        disabled={isPending}
      >
        {isPending ? "Logging out..." : "Logout"}
      </button>

      {isError && <p>{String(error)}</p>}
    </div>
  );
}
