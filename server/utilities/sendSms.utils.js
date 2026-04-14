import axios from "axios";

export const sendSms = async (mobile, otp) => {
    try {

        if (!mobile) {
            throw new Error("Mobile number is required");
        }

        const payload = {
            route: "dlt",
            sender_id: "KURUQC",
            message: "186094",
            variables_values: `${otp}`,
            flash: 0,
            numbers: mobile
        };

        const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            payload,
            {
                headers: {
                    authorization: process.env.FAST2SMS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;

    } catch (err) {
        console.error("Error sending SMS:", err.response?.data || err.message);
        throw err;
    }
};