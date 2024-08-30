import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const scales = {
  'Minor Second': 1.067,
  'Major Second': 1.125,
  'Minor Third': 1.2,
  'Major Third': 1.25,
  'Perfect Fourth': 1.333,
  'Augmented Fourth': 1.414,
  'Perfect Fifth': 1.5,
  'Golden Ratio': 1.618
};

const TypographyScaleCalculator = () => {
  const [baseSize, setBaseSize] = useState(16);
  const [selectedScale, setSelectedScale] = useState('Perfect Fourth');
  const [steps, setSteps] = useState(9);
  const [selectedFont, setSelectedFont] = useState('');
  const [generatedScale, setGeneratedScale] = useState([]);

  const { data: fonts } = useQuery({
    queryKey: ['fonts'],
    queryFn: async () => {
      const response = await fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=YOUR_GOOGLE_FONTS_API_KEY');
      const data = await response.json();
      return data.items.map(font => font.family);
    }
  });

  useEffect(() => {
    generateScale();
  }, [baseSize, selectedScale, steps]);

  const generateScale = () => {
    const scaleValue = scales[selectedScale];
    const middleStep = Math.floor(steps / 2);
    const newScale = [];

    for (let i = 0; i < steps; i++) {
      const stepDiff = i - middleStep;
      const size = baseSize * Math.pow(scaleValue, stepDiff);
      const clampedSize = `clamp(${size * 0.75}px, ${size / 16}rem, ${size * 1.25}px)`;
      newScale.push({ step: i - middleStep, size: clampedSize });
    }

    setGeneratedScale(newScale);
  };

  const handleSave = () => {
    // TODO: Implement save functionality with GitHub auth
    toast.success("Scale saved successfully!");
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Typography Scale Calculator</CardTitle>
          <CardDescription>Generate a responsive typography scale using CSS clamp and modular scales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseSize">Base Size (px)</Label>
              <Input
                id="baseSize"
                type="number"
                value={baseSize}
                onChange={(e) => setBaseSize(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="scale">Scale</Label>
              <Select value={selectedScale} onValueChange={setSelectedScale}>
                <SelectTrigger>
                  <SelectValue>{selectedScale}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(scales).map((scale) => (
                    <SelectItem key={scale} value={scale}>
                      {scale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="steps">Number of Steps</Label>
              <Slider
                id="steps"
                min={3}
                max={15}
                step={2}
                value={[steps]}
                onValueChange={(value) => setSteps(value[0])}
              />
            </div>
            <div>
              <Label htmlFor="font">Font</Label>
              <Select value={selectedFont} onValueChange={setSelectedFont}>
                <SelectTrigger>
                  <SelectValue>{selectedFont || 'Select a font'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {fonts?.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="scale" className="mt-6">
            <TabsList>
              <TabsTrigger value="scale">Generated Scale</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="scale">
              <div className="space-y-2">
                {generatedScale.map(({ step, size }) => (
                  <div key={step} className="flex justify-between items-center">
                    <span>Step {step}</span>
                    <code>{size}</code>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="preview">
              <div style={{ fontFamily: selectedFont }}>
                {generatedScale.map(({ step, size }) => (
                  <p key={step} style={{ fontSize: size }}>
                    Typography Scale Step {step}: The quick brown fox jumps over the lazy dog
                  </p>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} className="mt-4">Save Scale</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypographyScaleCalculator;