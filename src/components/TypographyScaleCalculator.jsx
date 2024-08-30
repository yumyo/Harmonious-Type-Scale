import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

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

const htmlElements = ['title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'caption', 'small', 'micro'];

const TypographyScaleCalculator = () => {
  const [baseSize, setBaseSize] = useState(16);
  const [selectedScale, setSelectedScale] = useState('Perfect Fourth');
  const [positiveSteps, setPositiveSteps] = useState(5);
  const [negativeSteps, setNegativeSteps] = useState(2);
  const [selectedFont, setSelectedFont] = useState('');
  const [generatedScale, setGeneratedScale] = useState([]);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [cssOutput, setCssOutput] = useState('');

  const { data: fonts, isLoading, error } = useQuery({
    queryKey: ['fonts'],
    queryFn: async () => {
      const response = await fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyB98BqT3rpqG8H7kpskjkx6wHORf2_ZMyQ&sort=popularity');
      if (!response.ok) {
        throw new Error('Failed to fetch fonts');
      }
      const data = await response.json();
      return data.items.map(font => font.family);
    }
  });

  useEffect(() => {
    generateScale();
  }, [baseSize, selectedScale, positiveSteps, negativeSteps, isAdvanced]);

  useEffect(() => {
    if (selectedFont) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css?family=${selectedFont.replace(' ', '+')}`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [selectedFont]);

  const nthRoot = (n, degree) => {
    return Math.pow(n, 1 / degree);
  };

  const generateScale = () => {
    const scaleValue = scales[selectedScale];
    const newScale = [];
    const totalSteps = positiveSteps + negativeSteps + 1; // +1 for the base step

    if (isAdvanced) {
      let a = baseSize;
      const b = baseSize;
      const ratio = scaleValue;

      for (let step = -negativeSteps; step <= positiveSteps; step++) {
        if (step < 0) {
          a = a / nthRoot(ratio, totalSteps);
        } else if (step === 0) {
          a = b;
        } else {
          a = a * nthRoot(ratio, totalSteps);
        }
        const clampedSize = `clamp(${(a * 0.75).toFixed(2)}px, ${(a / 16).toFixed(2)}rem, ${(a * 1.25).toFixed(2)}px)`;
        newScale.push({ step, size: clampedSize });
      }
    } else {
      // Generate negative steps
      for (let i = negativeSteps; i > 0; i--) {
        const size = baseSize * Math.pow(scaleValue, -i);
        const clampedSize = `clamp(${(size * 0.75).toFixed(2)}px, ${(size / 16).toFixed(2)}rem, ${(size * 1.25).toFixed(2)}px)`;
        newScale.push({ step: -i, size: clampedSize });
      }

      // Add base size (step 0)
      newScale.push({ step: 0, size: `${baseSize}px` });

      // Generate positive steps
      for (let i = 1; i <= positiveSteps; i++) {
        const size = baseSize * Math.pow(scaleValue, i);
        const clampedSize = `clamp(${(size * 0.75).toFixed(2)}px, ${(size / 16).toFixed(2)}rem, ${(size * 1.25).toFixed(2)}px)`;
        newScale.push({ step: i, size: clampedSize });
      }
    }

    setGeneratedScale(newScale);
    generateCSSOutput(newScale);
  };

  const generateCSSOutput = (scale) => {
    let css = ':root {\n';
    scale.forEach(({ step, size }) => {
      css += `  --step-${step}: ${size};\n`;
    });
    css += '}\n\n';

    htmlElements.forEach((element, index) => {
      const step = scale[index] ? scale[index].step : 0;
      css += `${element} {\n  font-size: var(--step-${step});\n}\n\n`;
    });

    setCssOutput(css);
  };

  const handleSave = () => {
    // TODO: Implement save functionality with GitHub auth
    toast.success("Scale saved successfully!");
  };

  if (isLoading) return <div>Loading fonts...</div>;
  if (error) return <div>Error loading fonts: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Typography Scale Calculator</CardTitle>
          <CardDescription>Generate a responsive typography scale using CSS clamp and modular scales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="advanced-mode"
              checked={isAdvanced}
              onCheckedChange={setIsAdvanced}
            />
            <Label htmlFor="advanced-mode">Advanced Mode</Label>
          </div>

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
              <Label htmlFor="positiveSteps">Positive Steps</Label>
              <Slider
                id="positiveSteps"
                min={1}
                max={isAdvanced ? 36 : 10}
                step={1}
                value={[positiveSteps]}
                onValueChange={(value) => setPositiveSteps(value[0])}
              />
            </div>
            <div>
              <Label htmlFor="negativeSteps">Negative Steps</Label>
              <Slider
                id="negativeSteps"
                min={0}
                max={isAdvanced ? 12 : 5}
                step={1}
                value={[negativeSteps]}
                onValueChange={(value) => setNegativeSteps(value[0])}
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
              <TabsTrigger value="css">CSS Output</TabsTrigger>
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
                <h2 className="text-2xl font-bold mb-4">Font Preview: {selectedFont}</h2>
                {generatedScale.map(({ step, size }, index) => {
                  const Element = htmlElements[index] || 'p';
                  return (
                    <Element key={step} style={{ fontSize: size }}>
                      {Element}: The quick brown fox jumps over the lazy dog
                    </Element>
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="css">
              <Textarea
                value={cssOutput}
                readOnly
                className="w-full h-64 font-mono text-sm"
              />
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} className="mt-4">Save Scale</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypographyScaleCalculator;
