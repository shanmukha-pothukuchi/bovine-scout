import { TimerIcon } from "lucide-react";
import {
  FormElement,
  FormElementImperativeHandle,
  formElements,
  FormValidationResponse,
  UpdateFormValue,
} from "../FormElements";
import { number, ValidationError } from "yup";
import {
  forwardRef,
  useId,
  useImperativeHandle,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Button } from "../ui/Button";

interface StopwatchProps {
  label: string;
  statsType: "mean" | "median" | "mode";
}

const defaultProperties: StopwatchProps = {
  label: "Stopwatch Label",
  statsType: "mean",
};

export const Stopwatch: FormElement<StopwatchProps, number> = {
  type: "Stopwatch",
  properties: {
    label: {
      type: "string",
      name: "Label",
      description: "Label for Stopwatch",
    },
    statsType: {
      type: "select",
      name: "Statistics Type",
      description: "Type of statistics to show for laps",
      options: [
        { value: "mean", label: "Mean" },
        { value: "median", label: "Median" },
        { value: "mode", label: "Mode" },
      ],
    },
  },
  paletteComponent: {
    name: "Stopwatch",
    icon: TimerIcon,
  },
  builderComponent: ({ instance }) => (
    <StopwatchComponent properties={instance.properties} dummy />
  ),
  renderedComponent: forwardRef(({ instance, updateFormValue }, ref) => (
    <StopwatchComponent
      properties={instance.properties}
      ref={ref}
      updateFormValue={updateFormValue}
      formValidate={(value: unknown) =>
        formElements[instance.type].validate(instance, value)
      }
    />
  )),
  generateInstance: (id: string) => ({
    id,
    type: "Stopwatch",
    properties: { ...defaultProperties },
  }),
  validate: (_, value) => {
    const schema = number();
    try {
      schema.validateSync(value);
      return { error: false };
    } catch (err) {
      const error: FormValidationResponse = { error: true };
      if (err instanceof ValidationError) {
        return { ...error, message: err.message };
      }
      return error;
    }
  },
};

const calculateStats = (
  laps: number[],
  type: "mean" | "median" | "mode"
): number => {
  if (laps.length === 0) return 0;

  if (type === "mean") {
    return laps.reduce((a, b) => a + b, 0) / laps.length;
  }

  if (type === "median") {
    const sorted = [...laps].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  if (type === "mode") {
    const frequencies = laps.reduce((acc: { [key: number]: number }, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
    return Number(
      Object.entries(frequencies).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
    );
  }

  return 0;
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
};

// eslint-disable-next-line react-refresh/only-export-components
const StopwatchComponent = forwardRef<
  FormElementImperativeHandle,
  {
    properties: StopwatchProps;
    formValidate?: (value: unknown) => FormValidationResponse;
    updateFormValue?: UpdateFormValue<number>;
    dummy?: boolean;
  }
>(
  (
    { properties: { label, statsType }, formValidate, dummy, updateFormValue },
    ref
  ) => {
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [laps, setLaps] = useState<number[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [validation, setValidation] = useState<FormValidationResponse>({
      error: false,
    });
    const inputId = useId();

    const validate = useCallback(() => {
      if (!formValidate) return true;
      const res = formValidate(time);
      setValidation(res);
      return !res.error;
    }, [formValidate, time]);

    useImperativeHandle(ref, () => ({
      validate,
    }));

    useEffect(() => {
      let intervalId: number;

      if (isRunning && startTime !== null) {
        intervalId = setInterval(() => {
          setTime(Date.now() - startTime);
        }, 10);
      }

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }, [isRunning, startTime]);

    useEffect(() => {
      if (!dummy && updateFormValue) {
        const currentStats = calculateStats(laps, statsType);
        updateFormValue(currentStats);
      }
    }, [laps, statsType, dummy, updateFormValue]);

    const handleStartPause = () => {
      if (dummy) return;

      if (isRunning) {
        setIsRunning(false);
      } else {
        setIsRunning(true);
        setStartTime(
          startTime === null ? Date.now() - time : Date.now() - (time || 0)
        );
      }
    };

    const handleLap = () => {
      if (dummy) return;
      setLaps((prev) => [...prev, time]);
      setTime(0);
      setStartTime(Date.now());
    };

    const handleReset = () => {
      if (dummy) return;
      setIsRunning(false);
      setTime(0);
      setLaps([]);
      setStartTime(null);
    };

    const statsValue = calculateStats(laps, statsType);

    const newLapEntry = useRef<HTMLTableRowElement>(null);

    if (newLapEntry.current) {
      newLapEntry.current?.scrollIntoView({ behavior: "instant" });
    }

    return (
      <div className="bg-white w-full p-2 ring-1 ring-gray-400 rounded-sm min-h-full">
        <label htmlFor={inputId} className="text-xs">
          {label}
        </label>

        <div className="text-center space-y-1">
          <div className="text-xl tabular-nums">{formatTime(time)}</div>

          {laps.length > 0 && (
            <div className="text-sm text-gray-600">
              {statsType.charAt(0).toUpperCase() + statsType.slice(1)}:{" "}
              {formatTime(statsValue)}
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleStartPause}
              disabled={dummy}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-xs"
            >
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button
              onClick={handleLap}
              disabled={dummy}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-xs"
            >
              Lap
            </Button>
            <Button
              onClick={handleReset}
              disabled={dummy || (time === 0 && laps.length === 0)}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-xs"
            >
              Reset
            </Button>
          </div>

          {laps.length > 0 && (
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-2">Lap</th>
                    <th className="py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {laps.map((lapTime, index) => (
                    <tr
                      key={index}
                      className="border-t"
                      ref={index === laps.length - 1 ? newLapEntry : null}
                    >
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2 tabular-nums">
                        {formatTime(lapTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {validation.error && (
          <p className="text-red-500 text-sm">{validation.message}</p>
        )}
      </div>
    );
  }
);

StopwatchComponent.displayName = "StopwatchComponent";
