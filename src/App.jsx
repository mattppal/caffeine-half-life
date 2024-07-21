import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Trash2, Plus } from 'lucide-react';

const CAFFEINE_HALF_LIFE = 5; // hours
const TOTAL_DURATION = 24; // hours

const CaffeineHalfLifeApp = () => {
  const [intakes, setIntakes] = useState([{ time: 6, amount: 100 }]);
  const [error, setError] = useState('');
  const chartConfig = {
    caffeine: {
      label: "Caffeine",
      color: "hsl(var(--chart-1))",
    },
  }

  const addIntake = () => {
    const lastIntake = intakes[intakes.length - 1];
    let newTime = (lastIntake.time + 2) % 24;
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

  const startTime = useMemo(() => {
    const sortedIntakes = [...intakes].sort((a, b) => a.time - b.time);
    return sortedIntakes[0].time;
  }, [intakes]);

  return (
    <div className="h-screen flex items-center" >
      <Card className="w-full max-w-4xl mx-auto p-8">
        <CardHeader className="px-0">
          <CardTitle>☕ Caffeine Half-Life</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="text-sm text-gray-600 mb-6">
            <p>
              The half-life of caffeine is approximately 5 hours. This means that every 5 hours,
              the amount of caffeine in your body reduces by half. The chart below shows how the
              caffeine level changes over a 24-hour period starting from your first intake.
            </p>
            {/* <h3 className="font-semibold mb-2">Typical Caffeine Amounts:</h3> */}
            {/* <Table className="mb-1">
              <TableHeader>
                <TableRow>
                  <TableHead>Beverage</TableHead>
                  <TableHead>Serving Size</TableHead>
                  <TableHead>Caffeine (mg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Espresso</TableCell>
                  <TableCell>1 shot (30 ml)</TableCell>
                  <TableCell>63</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Brewed Coffee</TableCell>
                  <TableCell>1 cup (240 ml)</TableCell>
                  <TableCell>96</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Black Tea</TableCell>
                  <TableCell>1 cup (240 ml)</TableCell>
                  <TableCell>47</TableCell>
                </TableRow>
              </TableBody>
            </Table> */}
          </div>

          <Table className="mb-4">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Time (HH:MM)</TableHead>
                <TableHead className="w-1/3">Caffeine Amount (mg)</TableHead>
                <TableHead className="w-1/3"></TableHead>
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
                    <Button variant="ghost" onClick={() => removeIntake(index)} className="w-full">
                      <Trash2 className="h-5 w-5 mr-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  <Button variant="ghost" onClick={addIntake} className="w-full">
                    <Plus className="h-5 w-5" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="h-[400px] w-full mb-6">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                    tickMargin={8}
                    domain={[startTime, (startTime + 24) % 24]}
                    label={{ value: 'Time (HH:MM)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    label={{ value: 'Caffeine (mg)', angle: -90, position: 'insideLeft', offset: 10 }}
                    tickMargin={8}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Line type="linear" dataKey="caffeine" stroke="var(--color-caffeine)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <br></br>
        </CardContent>
      </Card >
    </div >
  );
};

export default CaffeineHalfLifeApp;