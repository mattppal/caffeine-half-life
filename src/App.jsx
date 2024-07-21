import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from 'lucide-react';

const CAFFEINE_HALF_LIFE = 5; // hours
const TOTAL_DURATION = 24; // hours

const CaffeineHalfLifeApp = () => {
  const [intakes, setIntakes] = useState([{ time: 6, amount: 75 }]);
  const [error, setError] = useState('');

  const addIntake = () => {
    const lastIntake = intakes[intakes.length - 1];
    let newTime = (lastIntake.time + 2) % 24;
    // Ensure the new time is always after the last intake
    if (newTime <= lastIntake.time) {
      newTime = (lastIntake.time + 2) % 24;
    }
    setIntakes([...intakes, { time: newTime, amount: 100 }]);
  };

  const removeIntake = (index) => {
    setIntakes(intakes.filter((_, i) => i !== index));
  };

  const updateIntake = (index, field, value) => {
    const newIntakes = [...intakes];
    newIntakes[index][field] = Number(value);
    setIntakes(newIntakes);
  };

  const validateIntakes = () => {
    for (let intake of intakes) {
      if (intake.time < 0 || intake.time >= 24) {
        setError('Time must be between 0 and 23.99 hours');
        return false;
      }
      if (intake.amount <= 0 || intake.amount > 1000) {
        setError('Caffeine amount must be between 1 and 1000 mg');
        return false;
      }
    }
    setError('');
    return true;
  };

  const chartData = useMemo(() => {
    if (!validateIntakes()) return [];

    const sortedIntakes = [...intakes].sort((a, b) => a.time - b.time);
    const startTime = sortedIntakes[0].time;

    // Generate data for exactly 24 hours
    const data = Array.from({ length: TOTAL_DURATION * 60 }, (_, minute) => ({
      time: (startTime + minute / 60) % 24,
      caffeine: 0
    }));

    sortedIntakes.forEach(intake => {
      const intakeMinute = Math.round((intake.time - startTime + 24) % 24 * 60);
      for (let minute = 0; minute < TOTAL_DURATION * 60; minute++) {
        const timeSinceIntake = (minute - intakeMinute + TOTAL_DURATION * 60) % (TOTAL_DURATION * 60) / 60;
        if (timeSinceIntake >= 0) {
          data[minute].caffeine += intake.amount * Math.pow(0.5, timeSinceIntake / CAFFEINE_HALF_LIFE);
        }
      }
    });

    return data;
  }, [intakes]);

  const formatXAxis = (time) => {
    const hours = Math.floor(time);
    return `${hours.toString().padStart(2, '0')}:00`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const time = formatXAxis(label);
      const caffeine = Math.round(payload[0].value);
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p>Time: {time}</p>
          <p>Caffeine: {caffeine} mg</p>
        </div>
      );
    }
    return null;
  };

  const startTime = useMemo(() => {
    const sortedIntakes = [...intakes].sort((a, b) => a.time - b.time);
    return sortedIntakes[0].time;
  }, [intakes]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>☕ Caffeine Half-Life Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time (HH:MM)</TableHead>
              <TableHead>Caffeine Amount (mg)</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {intakes.map((intake, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    type="time"
                    value={formatXAxis(intake.time)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const time = Number(hours) + Number(minutes) / 60;
                      updateIntake(index, 'time', time);
                    }}
                    step="60"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={intake.amount}
                    onChange={(e) => updateIntake(index, 'amount', e.target.value)}
                    min="1"
                    max="1000"
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" onClick={() => removeIntake(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button onClick={addIntake} className="mt-4">Add Intake</Button>

        {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="h-[400px] w-full mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                ticks={[
                  startTime,
                  (startTime + 4) % 24,
                  (startTime + 8) % 24,
                  (startTime + 12) % 24,
                  (startTime + 16) % 24,
                  (startTime + 20) % 24
                ]}
                domain={[startTime, (startTime + 24) % 24]}
                label={{ value: 'Time (HH:MM)', position: 'insideBottomRight', offset: -10 }}
              />
              <YAxis label={{ value: 'Caffeine (mg)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="caffeine" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">About Caffeine Half-Life:</h3>
          <p>
            The half-life of caffeine is approximately 5 hours. This means that every 5 hours,
            the amount of caffeine in your body reduces by half. The chart above shows how the
            caffeine level changes over a 24-hour period starting from your first intake.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaffeineHalfLifeApp;