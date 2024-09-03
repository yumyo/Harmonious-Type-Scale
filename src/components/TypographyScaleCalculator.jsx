import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

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

const htmlElements = ['display', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'caption', 'small', 'micro'];

const presets = {
  'display': 9,
  'title': 8,
  'h1': 7,
  'h2': 6,
  'h3': 5,
  'h4': 4,
  'h5': 3,
  'h6': 2,
  'blockquote': 1,
  'p': 0,
  'small': -1,
  'caption': -2,
  'micro': -3
};

const TypographyScaleCalculator = () => {
  const [baseSize, setBaseSize] = useState(16);
  const [selectedScale, setSelectedScale] = useState('Perfect Fourth');
  const [selectedMobileScale, setSelectedMobileScale] = useState('Perfect Fourth');
  const [positiveSteps, setPositiveSteps] = useState(9);
  const [negativeSteps, setNegativeSteps] = useState(3);
  const [selectedFont, setSelectedFont] = useState('');
  const [generatedScale, setGeneratedScale] = useState([]);
  const [generatedMobileScale, setGeneratedMobileScale] = useState([]);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [cssOutput, setCssOutput] = useState('');
  const [elementSteps, setElementSteps] = useState(presets);
  const [useMobileScale, setUseMobileScale] = useState(false);
  const [mobileBaseSize, setMobileBaseSize] = useState(14);
  const [breakpoint, setBreakpoint] = useState(768);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');

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
  }, [baseSize, mobileBaseSize, selectedScale, selectedMobileScale, positiveSteps, negativeSteps, isAdvanced, elementSteps, useMobileScale, breakpoint]);

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
    const desktopScaleValue = scales[selectedScale];
    const mobileScaleValue = scales[selectedMobileScale];
    const desktopScale = generateScaleForBaseSize(baseSize, desktopScaleValue);
    setGeneratedScale(desktopScale);

    if (useMobileScale) {
      const mobileScale = generateScaleForBaseSize(mobileBaseSize, mobileScaleValue);
      setGeneratedMobileScale(mobileScale);
      generateCSSOutput(desktopScale, mobileScale);
    } else {
      generateCSSOutput(desktopScale);
    }
  };

  const generateScaleForBaseSize = (size, scaleValue) => {
    const newScale = [];
    const totalSteps = positiveSteps + negativeSteps + 1; // +1 for the base step

    if (isAdvanced) {
      let a = size;
      const b = size;
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
        const stepSize = size * Math.pow(scaleValue, -i);
        const clampedSize = `clamp(${(stepSize * 0.75).toFixed(2)}px, ${(stepSize / 16).toFixed(2)}rem, ${(stepSize * 1.25).toFixed(2)}px)`;
        newScale.push({ step: -i, size: clampedSize });
      }

      // Add base size (step 0)
      newScale.push({ step: 0, size: `${size}px` });

      // Generate positive steps
      for (let i = 1; i <= positiveSteps; i++) {
        const stepSize = size * Math.pow(scaleValue, i);
        const clampedSize = `clamp(${(stepSize * 0.75).toFixed(2)}px, ${(stepSize / 16).toFixed(2)}rem, ${(stepSize * 1.25).toFixed(2)}px)`;
        newScale.push({ step: i, size: clampedSize });
      }
    }

    return newScale;
  };

  const generateCSSOutput = (desktopScale, mobileScale = null) => {
    let css = ':root {\n';
    desktopScale.forEach(({ step, size }) => {
      css += `  --step-${step}: ${size};\n`;
    });
    css += '}\n\n';

    if (mobileScale) {
      css += `@media (max-width: ${breakpoint}px) {\n  :root {\n`;
      mobileScale.forEach(({ step, size }) => {
        css += `    --step-${step}: ${size};\n`;
      });
      css += '  }\n}\n\n';
    }

    htmlElements.forEach((element) => {
      const step = elementSteps[element];
      const scaleItem = desktopScale.find(item => item.step === step);
      if (scaleItem) {
        if (element === 'display' || element === 'title' || element === 'micro') {
          css += `.${element} {\n  font-size: var(--step-${step});\n}\n\n`;
        } else {
          css += `${element} {\n  font-size: var(--step-${step});\n}\n\n`;
        }
      }
    });

    setCssOutput(css);
  };

  const handleSave = () => {
    // TODO: Implement save functionality with GitHub auth
    toast.success("Scale saved successfully!");
  };

  const handleElementStepChange = (element, step) => {
    setElementSteps(prev => ({ ...prev, [element]: step }));
  };

  if (isLoading) return <div>Loading fonts...</div>;
  if (error) return <div>Error loading fonts: {error.message}</div>;

  return (
    <div className="w-full h-screen">
      <Card className="h-full">
        <CardContent className="p-0 h-full">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={30} minSize={20} maxSize={40} className="h-full">
              <div className="p-4 h-full overflow-y-auto flex flex-col">
                <div className="flex-grow">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="advanced-mode"
                      checked={isAdvanced}
                      onCheckedChange={setIsAdvanced}
                    />
                    <Label htmlFor="advanced-mode">Advanced Mode</Label>
                  </div>

                  <div className="space-y-4">
                    <div className="w-full">
                      <Label htmlFor="baseSize" className="block mb-1">Base Size (px)</Label>
                      <Input
                        id="baseSize"
                        type="number"
                        value={baseSize}
                        onChange={(e) => setBaseSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="scale" className="block mb-1">Scale</Label>
                      <Select value={selectedScale} onValueChange={setSelectedScale}>
                        <SelectTrigger className="w-full">
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
                    <div className="w-full">
                      <Label htmlFor="positiveSteps" className="block mb-1">Positive Steps</Label>
                      <Slider
                        id="positiveSteps"
                        min={1}
                        max={isAdvanced ? 36 : 10}
                        step={1}
                        value={[positiveSteps]}
                        onValueChange={(value) => setPositiveSteps(value[0])}
                        className="w-full"
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="negativeSteps" className="block mb-1">Negative Steps</Label>
                      <Slider
                        id="negativeSteps"
                        min={0}
                        max={isAdvanced ? 12 : 5}
                        step={1}
                        value={[negativeSteps]}
                        onValueChange={(value) => setNegativeSteps(value[0])}
                        className="w-full"
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="font" className="block mb-1">Font</Label>
                      <Select value={selectedFont} onValueChange={setSelectedFont}>
                        <SelectTrigger className="w-full">
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

                  <div className="mt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Switch
                        id="use-mobile-scale"
                        checked={useMobileScale}
                        onCheckedChange={setUseMobileScale}
                      />
                      <Label htmlFor="use-mobile-scale">Use Mobile Scale</Label>
                    </div>
                    {useMobileScale && (
                      <div className="space-y-4 mt-4">
                        <div className="w-full">
                          <Label htmlFor="mobileBaseSize" className="block mb-1">Mobile Base Size (px)</Label>
                          <Input
                            id="mobileBaseSize"
                            type="number"
                            value={mobileBaseSize}
                            onChange={(e) => setMobileBaseSize(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div className="w-full">
                          <Label htmlFor="mobileScale" className="block mb-1">Mobile Scale</Label>
                          <Select value={selectedMobileScale} onValueChange={setSelectedMobileScale}>
                            <SelectTrigger className="w-full">
                              <SelectValue>{selectedMobileScale}</SelectValue>
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
                        <div className="w-full">
                          <Label htmlFor="breakpoint" className="block mb-1">Breakpoint (px)</Label>
                          <Input
                            id="breakpoint"
                            type="number"
                            value={breakpoint}
                            onChange={(e) => setBreakpoint(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Element Step Assignment</h3>
                    <div className="space-y-2">
                      {htmlElements.map((element) => (
                        <div key={element} className="flex items-center justify-between">
                          <Label htmlFor={`step-${element}`} className="flex-grow">{element}</Label>
                          <Select
                            value={elementSteps[element].toString()}
                            onValueChange={(value) => handleElementStepChange(element, parseInt(value))}
                          >
                            <SelectTrigger id={`step-${element}`} className="w-24">
                              <SelectValue>{elementSteps[element]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {generatedScale.map(({ step }) => (
                                <SelectItem key={step} value={step.toString()}>
                                  {step}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={handleSave} className="mt-4 w-full">Save Scale</Button>
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
            <Panel className="h-full">
              <div className="p-4 h-full overflow-y-auto">
                <Tabs defaultValue="scale" className="h-full flex flex-col">
                  <TabsList className="w-full">
                    <TabsTrigger value="scale" className="flex-1">Generated Scale</TabsTrigger>
                    <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                    <TabsTrigger value="css" className="flex-1">CSS Output</TabsTrigger>
                  </TabsList>
                  <TabsContent value="scale" className="flex-grow overflow-y-auto">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Desktop Scale</h3>
                      {generatedScale.map(({ step, size }) => (
                        <div key={step} className="flex justify-between items-center">
                          <span>Step {step}</span>
                          <code>{size}</code>
                        </div>
                      ))}
                      {useMobileScale && (
                        <>
                          <h3 className="font-semibold mt-4">Mobile Scale</h3>
                          {generatedMobileScale.map(({ step, size }) => (
                            <div key={step} className="flex justify-between items-center">
                              <span>Step {step}</span>
                              <code>{size}</code>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="preview" className="flex-grow overflow-y-auto">
                    <div style={{ fontFamily: selectedFont }}>
                      <h2 className="text-2xl font-bold mb-4">Font Preview: {selectedFont}</h2>
                      <div className="mb-4">
                        <Label htmlFor="previewText" className="block mb-1">Preview Text</Label>
                        <Input
                          id="previewText"
                          value={previewText}
                          onChange={(e) => setPreviewText(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold mb-2">Desktop</h3>
                          {htmlElements.map((element) => {
                            const step = elementSteps[element];
                            const scaleItem = generatedScale.find(item => item.step === step);
                            const Element = element === 'display' || element === 'title' || element === 'micro' ? 'div' : element;
                            return (
                              <Element key={element} className={`${element === 'display' || element === 'title' || element === 'micro' ? element : ''} w-full`} style={{ fontSize: scaleItem ? scaleItem.size : 'inherit' }}>
                                {element}: {previewText}
                              </Element>
                            );
                          })}
                        </div>
                        {useMobileScale && (
                          <div>
                            <h3 className="font-semibold mb-2">Mobile</h3>
                            {htmlElements.map((element) => {
                              const step = elementSteps[element];
                              const scaleItem = generatedMobileScale.find(item => item.step === step);
                              const Element = element === 'display' || element === 'title' || element === 'micro' ? 'div' : element;
                              return (
                                <Element key={element} className={`${element === 'display' || element === 'title' || element === 'micro' ? element : ''} w-full`} style={{ fontSize: scaleItem ? scaleItem.size : 'inherit' }}>
                                  {element}: {previewText}
                                </Element>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="css" className="flex-grow">
                    <Textarea
                      value={cssOutput}
                      readOnly
                      className="w-full h-full font-mono text-sm resize-none"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </Panel>
          </PanelGroup>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypographyScaleCalculator;