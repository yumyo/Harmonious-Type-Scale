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

const previewPresets = {
  'Default': {
    'display': 'Display Text',
    'title': 'Title Text',
    'h1': 'Heading 1',
    'h2': 'Heading 2',
    'h3': 'Heading 3',
    'h4': 'Heading 4',
    'h5': 'Heading 5',
    'h6': 'Heading 6',
    'blockquote': 'This is a blockquote. It stands out from regular text.',
    'p': 'This is a paragraph of text. It demonstrates the base font size and how it looks in a block of content.',
    'caption': 'This is a caption, often used for images or tables.',
    'small': 'This is small text, used for fine print or less important information.',
    'micro': 'Micro text for very small details.'
  },
  'Blog Post': {
    'display': 'The Art of Typography',
    'title': 'Mastering the Craft of Beautiful Text',
    'h1': 'Introduction to Typography',
    'h2': 'The Importance of Font Selection',
    'h3': 'Understanding Kerning and Tracking',
    'h4': 'The Role of White Space',
    'h5': 'Color Theory in Typography',
    'h6': 'Responsive Typography Techniques',
    'blockquote': '"Typography is the craft of endowing human language with a durable visual form." - Robert Bringhurst',
    'p': `Typography is more than just choosing a pretty font. It's about communication, readability, and creating a visual hierarchy that guides the reader through your content. Good typography can make the difference between a reader staying engaged or clicking away.`,
    'caption': 'Fig. 1: Examples of different typefaces and their emotional impact',
    'small': 'This article was last updated on May 15, 2023',
    'micro': '© 2023 Typography Experts Inc.'
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
  const [selectedPresetGroup, setSelectedPresetGroup] = useState('Default');
  const [selectedPreviewPreset, setSelectedPreviewPreset] = useState('Default');
  const { theme, setTheme } = useTheme();

  const [useRem, setUseRem] = useState(true);
  const [useCSSLocks, setUseCSSLocks] = useState(false);
  const [cssVariablePrefix, setCssVariablePrefix] = useState('fs');
  const [outputSassVariables, setOutputSassVariables] = useState(false);
  const [minLineHeight, setMinLineHeight] = useState(1.2);
  const [maxLineHeight, setMaxLineHeight] = useState(1.5);
  const [remBaseSize, setRemBaseSize] = useState(16);

  const [minBaseSize, setMinBaseSize] = useState(14);
  const [minScreenWidth, setMinScreenWidth] = useState(320);
  const [minScaleRatio, setMinScaleRatio] = useState('Minor Third');
  const [maxBaseSize, setMaxBaseSize] = useState(18);
  const [maxScreenWidth, setMaxScreenWidth] = useState(1920);
  const [maxScaleRatio, setMaxScaleRatio] = useState('Perfect Fourth');

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
  }, [baseSize, selectedScale, positiveSteps, negativeSteps, isAdvanced, elementSteps, minBaseSize, minScreenWidth, minScaleRatio, maxBaseSize, maxScreenWidth, maxScaleRatio, useRem, useCSSLocks, cssVariablePrefix, outputSassVariables, minLineHeight, maxLineHeight, remBaseSize]);

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
      let size;
      
      if (useCSSLocks) {
        const slope = (maxSize - minSize) / (maxScreenWidth - minScreenWidth);
        const yAxisIntersection = minSize - slope * minScreenWidth;
        size = `calc(${yAxisIntersection.toFixed(2)}px + ${(slope * 100).toFixed(2)}vw)`;
      } else {
        const minSizeRem = useRem ? (minSize / remBaseSize).toFixed(4) : minSize.toFixed(2);
        const maxSizeRem = useRem ? (maxSize / remBaseSize).toFixed(4) : maxSize.toFixed(2);
        const minSizeUnit = useRem ? `${minSizeRem}rem` : `${minSizeRem}px`;
        const maxSizeUnit = useRem ? `${maxSizeRem}rem` : `${maxSizeRem}px`;
        size = `clamp(${minSizeUnit}, calc(${minSizeUnit} + (${maxSizeRem} - ${minSizeRem}) * ((100vw - ${minScreenWidth}px) / (${maxScreenWidth - minScreenWidth}))), ${maxSizeUnit})`;
      }

      const lineHeight = `calc(${minLineHeight} + (${maxLineHeight} - ${minLineHeight}) * ((100vw - ${minScreenWidth}px) / (${maxScreenWidth} - ${minScreenWidth})))`;
      
      newScale.push({ step, size, lineHeight });
    }

    setGeneratedScale(newScale);
    generateCSSOutput(newScale);
  };

  const generateCSSOutput = (scale) => {
    let css = ':root {\n';
    css += `  --rem-base: ${remBaseSize}px;\n`;
    scale.forEach(({ step, size, lineHeight }) => {
      css += `  --${cssVariablePrefix}-${step}: ${size};\n`;
      css += `  --lh-${step}: ${lineHeight};\n`;
    });
    css += '}\n\n';

    htmlElements.forEach((element) => {
      const step = elementSteps[element];
      const scaleItem = scale.find(item => item.step === step);
      if (scaleItem) {
        if (element === 'display' || element === 'title' || element === 'micro') {
          css += `.${element} {\n  font-size: var(--${cssVariablePrefix}-${step});\n  line-height: var(--lh-${step});\n}\n\n`;
        } else {
          css += `${element} {\n  font-size: var(--${cssVariablePrefix}-${step});\n  line-height: var(--lh-${step});\n}\n\n`;
        }
      }
    });

    if (outputSassVariables) {
      css += '// SASS Variables\n';
      css += `$rem-base: ${remBaseSize}px;\n`;
      scale.forEach(({ step, size, lineHeight }) => {
        css += `$${cssVariablePrefix}-${step}: ${size};\n`;
        css += `$lh-${step}: ${lineHeight};\n`;
      });
    }

    setCssOutput(css);

    // Apply the generated CSS to the document
    const styleElement = document.getElementById('typography-scale-styles');
    if (styleElement) {
      styleElement.textContent = css;
    } else {
      const newStyleElement = document.createElement('style');
      newStyleElement.id = 'typography-scale-styles';
      newStyleElement.textContent = css;
      document.head.appendChild(newStyleElement);
    }
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

  if (isLoading) return <div>Loading fonts...</div>;
  if (error) return <div>Error loading fonts: {error.message}</div>;

  return (
    <div className="w-full h-screen p-4">
      <Card className="h-full">
        <CardContent className="p-0 h-full">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={30} minSize={20} maxSize={40} className="h-full">
              <div className="p-4 h-full overflow-y-auto flex flex-col bg-neutral-950 text-neutral-100">
                <h1 className="text-2xl font-bold mb-4">Harmonious Type Scale</h1>
                <div className="mb-4">
                  <Label htmlFor="theme-toggle" className="mb-2 block">Theme</Label>
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
                <div className="mb-4">
                  <Label htmlFor="unit-toggle" className="mb-2 block">Unit</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="unit-toggle"
                      checked={useRem}
                      onCheckedChange={setUseRem}
                    />
                    <Label htmlFor="unit-toggle">{useRem ? 'Rem' : 'Pixel'}</Label>
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="rem-base-size" className="mb-2 block">1 Rem = X Pixels</Label>
                  <Input
                    id="rem-base-size"
                    type="number"
                    value={remBaseSize}
                    onChange={(e) => setRemBaseSize(Number(e.target.value))}
                    className="w-full bg-neutral-800 text-neutral-100"
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="css-locks-toggle" className="mb-2 block">Use CSS Locks</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="css-locks-toggle"
                      checked={useCSSLocks}
                      onCheckedChange={setUseCSSLocks}
                    />
                    <Label htmlFor="css-locks-toggle">{useCSSLocks ? 'CSS Locks' : 'Clamp'}</Label>
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="css-variable-prefix" className="mb-2 block">CSS Variable Prefix</Label>
                  <Input
                    id="css-variable-prefix"
                    value={cssVariablePrefix}
                    onChange={(e) => setCssVariablePrefix(e.target.value)}
                    className="w-full bg-neutral-800 text-neutral-100"
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="sass-variables-toggle" className="mb-2 block">Output SASS Variables</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sass-variables-toggle"
                      checked={outputSassVariables}
                      onCheckedChange={setOutputSassVariables}
                    />
                    <Label htmlFor="sass-variables-toggle">{outputSassVariables ? 'Include SASS Variables' : 'CSS Only'}</Label>
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="min-line-height" className="mb-2 block">Min Line Height</Label>
                  <Input
                    id="min-line-height"
                    type="number"
                    step="0.1"
                    value={minLineHeight}
                    onChange={(e) => setMinLineHeight(Number(e.target.value))}
                    className="w-full bg-neutral-800 text-neutral-100"
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="max-line-height" className="mb-2 block">Max Line Height</Label>
                  <Input
                    id="max-line-height"
                    type="number"
                    step="0.1"
                    value={maxLineHeight}
                    onChange={(e) => setMaxLineHeight(Number(e.target.value))}
                    className="w-full bg-neutral-800 text-neutral-100"
                  />
                </div>
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
                      {generatedScale.map(({ step, size, lineHeight }) => (
                        <div key={step} className="flex justify-between items-center">
                          <span>Step {step}</span>
                          <code>{size}</code>
                          <code>LH: {lineHeight}</code>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="preview" className="flex-grow overflow-y-auto px-4 py-4 mt-4">
                    <div style={{ fontFamily: selectedFont }} className="w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Font Preview: {selectedFont}</h2>
                        <Select value={selectedPreviewPreset} onValueChange={setSelectedPreviewPreset}>
                          <SelectTrigger className="w-48 bg-neutral-800 text-neutral-100">
                            <SelectValue>{selectedPreviewPreset}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(previewPresets).map((preset) => (
                              <SelectItem key={preset} value={preset}>
                                {preset}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full">
                        {htmlElements.map((element) => {
                          const Element = element === 'display' || element === 'title' || element === 'micro' ? 'div' : element;
                          return (
                            <Element
                              key={element}
                              className={`${element === 'display' || element === 'title' || element === 'micro' ? element : ''} w-full mb-4`}
                            >
                              {previewPresets[selectedPreviewPreset][element]}
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