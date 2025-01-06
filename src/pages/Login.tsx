import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { InferType, number, object, string, ValidationError } from "yup";
import { account, ID } from "../lib/appwrite";

export function Login() {
  const [showSignUpForm, setShowSignUpForm] = useState(false);

  const teamNumberSchema = number().positive();
  const loginFormSchema = object({
    email: string().email().required(),
    teamNumber: teamNumberSchema.optional(),
    password: string().min(8).required(),
  });

  type LoginForm = InferType<typeof loginFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: yupResolver(loginFormSchema),
  });

  const navigate = useNavigate();

  const submitHandler = async (data: LoginForm) => {
    try {
      if (showSignUpForm) {
        try {
          await teamNumberSchema.isValid(data.teamNumber);
        } catch (error) {
          if (error instanceof ValidationError) {
            setError("teamNumber", { message: error.message });
          }
          return;
        }

        await account.create(ID.unique(), data.email, data.password);
      }
      await account.createEmailPasswordSession(data.email, data.password);
      if (showSignUpForm) {
        await account.updatePrefs({ teamNumber: data.teamNumber });
      }
      navigate("/");
    } catch (error) {
      if (error instanceof Error) {
        setError("root", { message: error.message });
      } else {
        setError("root", { message: "An unknown error occurred" });
      }
    }
  };

  return (
    <div className="h-screen space-y-4 m-auto flex flex-col items-center justify-center px-4">
      <div className="w-full sm:w-fit border rounded-md p-4 border-gray-400">
        {errors.root && (
          <p className="w-full mb-2 sm:w-[300px] p-2 rounded-md border text-sm border-red-400 bg-red-100 text-red-500">
            {errors.root.message}
          </p>
        )}
        <h1 className="text-2xl font-semibold mb-2 text-center">
          {showSignUpForm ? "Signup" : "Login"}
        </h1>
        <form
          className="w-full sm:w-[300px] space-y-2.5"
          onSubmit={handleSubmit(submitHandler)}
        >
          <div className="flex flex-col gap-0.5">
            <label htmlFor="email" className="text-sm">
              Email
            </label>
            <input
              id="email"
              {...register("email")}
              type="text"
              placeholder="john.doe@gmail.com"
              className="border border-gray-300 p-2 rounded-md"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
          {showSignUpForm && (
            <div className="flex flex-col gap-0.5">
              <label htmlFor="team_number" className="text-sm">
                Team Number
              </label>
              <input
                id="team_number"
                {...register("teamNumber")}
                type="number"
                placeholder="686"
                className="border border-gray-300 p-2 rounded-md"
              />
              {errors.teamNumber && (
                <p className="text-red-500 text-sm">
                  {errors.teamNumber.message}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <label htmlFor="password" className="text-sm">
              Password
            </label>
            <input
              id="password"
              {...register("password")}
              type="password"
              placeholder="password123"
              className="border border-gray-300 p-2 rounded-md"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white p-2 rounded-md hover:bg-gray-800 transition duration-300"
          >
            Submit
          </button>
          <p
            className=" text-sm text-center"
            onClick={() => setShowSignUpForm(!showSignUpForm)}
          >
            {showSignUpForm
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <span className="underline cursor-pointer">
              {showSignUpForm ? "Login" : "Signup"}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
