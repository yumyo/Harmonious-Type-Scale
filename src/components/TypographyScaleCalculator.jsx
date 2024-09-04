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
import { useTheme } from './ThemeProvider';

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

const presetGroups = {
  'Default': {
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
    'caption': -1,
    'small': -1,
    'micro': -2
  },
  'Fibonacci': {
    'display': 13,
    'title': 8,
    'h1': 5,
    'h2': 3,
    'h3': 2,
    'h4': 1,
    'h5': 1,
    'h6': 0,
    'blockquote': 0,
    'p': 0,
    'caption': -1,
    'small': -1,
    'micro': -2
  }
};

const TypographyScaleCalculator = () => {
  const [baseSize, setBaseSize] = useState(16);
  const [selectedScale, setSelectedScale] = useState('Perfect Fourth');
  const [positiveSteps, setPositiveSteps] = useState(9);
  const [negativeSteps, setNegativeSteps] = useState(3);
  const [selectedFont, setSelectedFont] = useState('');
  const [generatedScale, setGeneratedScale] = useState([]);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [cssOutput, setCssOutput] = useState('');
  const [elementSteps, setElementSteps] = useState(presetGroups['Default']);
  const [compareScales, setCompareScales] = useState(false);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [selectedPresetGroup, setSelectedPresetGroup] = useState('Default');
  const { theme, setTheme } = useTheme();

  // Scale settings
  const [minBaseSize, setMinBaseSize] = useState(14);
  const [minScreenWidth, setMinScreenWidth] = useState(320);
  const [minScaleRatio, setMinScaleRatio] = useState('Minor Third');
  const [maxBaseSize, setMaxBaseSize] = useState(18);
  const [maxScreenWidth, setMaxScreenWidth] = useState(1920);
  const [maxScaleRatio, setMaxScaleRatio] = useState('Perfect Fourth');

  // Compare scale settings
  const [compareMinBaseSize, setCompareMinBaseSize] = useState(14);
  const [compareMinScreenWidth, setCompareMinScreenWidth] = useState(320);
  const [compareMinScaleRatio, setCompareMinScaleRatio] = useState('Minor Third');
  const [compareMaxBaseSize, setCompareMaxBaseSize] = useState(18);
  const [compareMaxScreenWidth, setCompareMaxScreenWidth] = useState(1920);
  const [compareMaxScaleRatio, setCompareMaxScaleRatio] = useState('Perfect Fourth');

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
  }, [baseSize, selectedScale, positiveSteps, negativeSteps, isAdvanced, elementSteps, minBaseSize, minScreenWidth, minScaleRatio, maxBaseSize, maxScreenWidth, maxScaleRatio]);

  useEffect(() => {
    if (selectedFont) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css?family=${selectedFont.replace(' ', '+')}`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [selectedFont]);

  const generateScale = () => {
    const newScale = [];
    const totalSteps = positiveSteps + negativeSteps + 1;

    for (let step = -negativeSteps; step <= positiveSteps; step++) {
      const minSize = minBaseSize * Math.pow(scales[minScaleRatio], step);
      const maxSize = maxBaseSize * Math.pow(scales[maxScaleRatio], step);
      const clampedSize = `clamp(${minSize.toFixed(2)}px, calc(${minSize.toFixed(2)}px + (${maxSize.toFixed(2)} - ${minSize.toFixed(2)}) * ((100vw - ${minScreenWidth}px) / (${maxScreenWidth} - ${minScreenWidth}))), ${maxSize.toFixed(2)}px)`;
      newScale.push({ step, size: clampedSize });
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

    htmlElements.forEach((element) => {
      const step = elementSteps[element];
      const scaleItem = scale.find(item => item.step === step);
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

  const handlePresetGroupChange = (group) => {
    setSelectedPresetGroup(group);
    setElementSteps(presetGroups[group]);
  };

  const handlePreviewTextChange = (element, text) => {
    setPreviewText(prevState => ({
      ...prevState,
      [element]: text
    }));
  };

  if (isLoading) return <div>Loading fonts...</div>;
  if (error) return <div>Error loading fonts: {error.message}</div>;

  return (
    <div className="w-full h-screen px-4 py-4">
      <Card className="h-full">
        <CardContent className="p-0 h-full">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={30} minSize={20} maxSize={40} className="h-full">
              <div className="p-4 h-full overflow-y-auto flex flex-col bg-neutral-950 text-neutral-100">
                <h1 className="text-2xl font-bold mb-6">Harmonious Type Scale</h1>
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
                      <Label htmlFor="minBaseSize" className="block mb-1">Min Base Size (px)</Label>
                      <Input
                        id="minBaseSize"
                        type="number"
                        value={minBaseSize}
                        onChange={(e) => setMinBaseSize(Number(e.target.value))}
                        className="w-full bg-neutral-800 text-neutral-100"
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="minScreenWidth" className="block mb-1">Min Screen Width (px)</Label>
                      <Input
                        id="minScreenWidth"
                        type="number"
                        value={minScreenWidth}
                        onChange={(e) => setMinScreenWidth(Number(e.target.value))}
                        className="w-full bg-neutral-800 text-neutral-100"
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="minScaleRatio" className="block mb-1">Min Scale Ratio</Label>
                      <Select value={minScaleRatio} onValueChange={setMinScaleRatio}>
                        <SelectTrigger className="w-full bg-neutral-800 text-neutral-100">
                          <SelectValue>{minScaleRatio}</SelectValue>
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
                      <Label htmlFor="maxBaseSize" className="block mb-1">Max Base Size (px)</Label>
                      <Input
                        id="maxBaseSize"
                        type="number"
                        value={maxBaseSize}
                        onChange={(e) => setMaxBaseSize(Number(e.target.value))}
                        className="w-full bg-neutral-800 text-neutral-100"
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="maxScreenWidth" className="block mb-1">Max Screen Width (px)</Label>
                      <Input
                        id="maxScreenWidth"
                        type="number"
                        value={maxScreenWidth}
                        onChange={(e) => setMaxScreenWidth(Number(e.target.value))}
                        className="w-full bg-neutral-800 text-neutral-100"
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="maxScaleRatio" className="block mb-1">Max Scale Ratio</Label>
                      <Select value={maxScaleRatio} onValueChange={setMaxScaleRatio}>
                        <SelectTrigger className="w-full bg-neutral-800 text-neutral-100">
                          <SelectValue>{maxScaleRatio}</SelectValue>
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
                        <SelectTrigger className="w-full bg-neutral-800 text-neutral-100">
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
                        id="compare-scales"
                        checked={compareScales}
                        onCheckedChange={setCompareScales}
                      />
                      <Label htmlFor="compare-scales">Compare Scales</Label>
                    </div>
                    {compareScales && (
                      <div className="space-y-4 mt-4">
                        <div className="w-full">
                          <Label htmlFor="compareMinBaseSize" className="block mb-1">Compare Min Base Size (px)</Label>
                          <Input
                            id="compareMinBaseSize"
                            type="number"
                            value={compareMinBaseSize}
                            onChange={(e) => setCompareMinBaseSize(Number(e.target.value))}
                            className="w-full bg-neutral-800 text-neutral-100"
                          />
                        </div>
                        <div className="w-full">
                          <Label htmlFor="compareMinScreenWidth" className="block mb-1">Compare Min Screen Width (px)</Label>
                          <Input
                            id="compareMinScreenWidth"
                            type="number"
                            value={compareMinScreenWidth}
                            onChange={(e) => setCompareMinScreenWidth(Number(e.target.value))}
                            className="w-full bg-neutral-800 text-neutral-100"
                          />
                        </div>
                        <div className="w-full">
                          <Label htmlFor="compareMinScaleRatio" className="block mb-1">Compare Min Scale Ratio</Label>
                          <Select value={compareMinScaleRatio} onValueChange={setCompareMinScaleRatio}>
                            <SelectTrigger className="w-full bg-neutral-800 text-neutral-100">
                              <SelectValue>{compareMinScaleRatio}</SelectValue>
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
                          <Label htmlFor="compareMaxBaseSize" className="block mb-1">Compare Max Base Size (px)</Label>
                          <Input
                            id="compareMaxBaseSize"
                            type="number"
                            value={compareMaxBaseSize}
                            onChange={(e) => setCompareMaxBaseSize(Number(e.target.value))}
                            className="w-full bg-neutral-800 text-neutral-100"
                          />
                        </div>
                        <div className="w-full">
                          <Label htmlFor="compareMaxScreenWidth" className="block mb-1">Compare Max Screen Width (px)</Label>
                          <Input
                            id="compareMaxScreenWidth"
                            type="number"
                            value={compareMaxScreenWidth}
                            onChange={(e) => setCompareMaxScreenWidth(Number(e.target.value))}
                            className="w-full bg-neutral-800 text-neutral-100"
                          />
                        </div>
                        <div className="w-full">
                          <Label htmlFor="compareMaxScaleRatio" className="block mb-1">Compare Max Scale Ratio</Label>
                          <Select value={compareMaxScaleRatio} onValueChange={setCompareMaxScaleRatio}>
                            <SelectTrigger className="w-full bg-neutral-800 text-neutral-100">
                              <SelectValue>{compareMaxScaleRatio}</SelectValue>
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
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Element Step Assignment</h3>
                    <div className="w-full mb-4">
                      <Label htmlFor="presetGroup" className="block mb-1">Preset Group</Label>
                      <Select value={selectedPresetGroup} onValueChange={handlePresetGroupChange}>
                        <SelectTrigger className="w-full bg-neutral-800 text-neutral-100">
                          <SelectValue>{selectedPresetGroup}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(presetGroups).map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      {htmlElements.map((element) => (
                        <div key={element} className="flex items-center justify-between">
                          <Label htmlFor={`step-${element}`} className="flex-grow">{element}</Label>
                          <Select
                            value={elementSteps[element].toString()}
                            onValueChange={(value) => handleElementStepChange(element, parseInt(value))}
                          >
                            <SelectTrigger id={`step-${element}`} className="w-24 bg-neutral-800 text-neutral-100">
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
                <div className="mt-4">
                  <Label htmlFor="theme-toggle">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme-toggle" className="w-full bg-neutral-800 text-neutral-100">
                      <SelectValue>{theme}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 bg-neutral-700 hover:bg-neutral-600 transition-colors" />
            <Panel className="h-full">
              <div className="p-4 h-full overflow-y-auto bg-neutral-900 text-neutral-100">
                <Tabs defaultValue="scale" className="h-full flex flex-col">
                  <TabsList className="w-full">
                    <TabsTrigger value="scale" className="flex-1">Generated Scale</TabsTrigger>
                    <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                    <TabsTrigger value="css" className="flex-1">CSS Output</TabsTrigger>
                  </TabsList>
                  <TabsContent value="scale" className="flex-grow overflow-y-auto px-4 py-4 mt-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Scale</h3>
                      {generatedScale.map(({ step, size }) => (
                        <div key={step} className="flex justify-between items-center">
                          <span>Step {step}</span>
                          <code>{size}</code>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="preview" className="flex-grow overflow-y-auto px-4 py-4 mt-4">
                    <div style={{ fontFamily: selectedFont }} className="w-full">
                      <h2 className="text-2xl font-bold mb-4">Font Preview: {selectedFont}</h2>
                      <div className="w-full">
                        {htmlElements.map((element) => {
                          const step = elementSteps[element];
                          const scaleItem = generatedScale.find(item => item.step === step);
                          const Element = element === 'display' || element === 'title' || element === 'micro' ? 'div' : element;
                          return (
                            <Element
                              key={element}
                              className={`${element === 'display' || element === 'title' || element === 'micro' ? element : ''} w-full`}
                              style={{ fontSize: scaleItem ? scaleItem.size : 'inherit' }}
                              contentEditable
                              onBlur={(e) => handlePreviewTextChange(element, e.target.textContent)}
                              suppressContentEditableWarning={true}
                            >
                              {element}: {previewText}
                            </Element>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="css" className="flex-grow h-full px-4 py-4 mt-4">
                    <Textarea
                      value={cssOutput}
                      readOnly
                      className="w-full h-full font-mono text-sm resize-none bg-neutral-800 text-neutral-100"
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