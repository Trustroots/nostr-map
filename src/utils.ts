import Swal from "sweetalert2";

export const confirmYesNo = async (text: string) => {
  const result = await Swal.fire({
    text,
    showCancelButton: true,
    cancelButtonText: "No",
    confirmButtonText: "Yes",
  });
  if (result.isDismissed) {
    return false;
  }
  if (result.isConfirmed) {
    return true;
  }
  return false;
};

export const alert = async (text: string) => {
  await Swal.fire({
    text,
  });
};

export const prompt = async ({
  text,
  inputLabel,
  inputValue,
}: {
  text: string;
  inputLabel?: string;
  inputValue?: string;
}) => {
  const keyResult = await Swal.fire({
    text,
    input: "text",
    inputLabel,
    inputValue,
  });
  if (typeof keyResult.value === "string") {
    return keyResult.value;
  }
};
