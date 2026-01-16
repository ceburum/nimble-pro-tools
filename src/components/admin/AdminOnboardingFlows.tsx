import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Workflow, GripVertical, Edit2, Save, Loader2, Eye, 
  ArrowRight, CheckCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface OnboardingStep {
  id: string;
  step_key: string;
  step_name: string;
  step_order: number;
  content_title: string | null;
  content_description: string | null;
  content_body: string | null;
  conditions: Json;
  is_active: boolean;
  applies_to_professions: string[];
  applies_to_roles: string[];
}

interface AppFlowStep {
  id: string;
  flow_name: string;
  step_key: string;
  step_name: string;
  step_order: number;
  next_step_key: string | null;
  conditions: Json;
  description: string | null;
  is_active: boolean;
}

export function AdminOnboardingFlows() {
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [appFlowSteps, setAppFlowSteps] = useState<AppFlowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [editForm, setEditForm] = useState({
    content_title: '',
    content_description: '',
    content_body: '',
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [onboardingRes, flowRes] = await Promise.all([
        supabase.from('onboarding_steps').select('*').order('step_order'),
        supabase.from('app_flow_steps').select('*').order('step_order')
      ]);

      if (onboardingRes.error) throw onboardingRes.error;
      if (flowRes.error) throw flowRes.error;

      setOnboardingSteps(onboardingRes.data || []);
      setAppFlowSteps(flowRes.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (step: OnboardingStep) => {
    setEditingStep(step);
    setEditForm({
      content_title: step.content_title || '',
      content_description: step.content_description || '',
      content_body: step.content_body || '',
      is_active: step.is_active
    });
  };

  const handleSaveStep = async () => {
    if (!editingStep) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('onboarding_steps')
        .update({
          content_title: editForm.content_title || null,
          content_description: editForm.content_description || null,
          content_body: editForm.content_body || null,
          is_active: editForm.is_active
        })
        .eq('id', editingStep.id);

      if (error) throw error;

      toast.success('Step updated successfully');
      setEditingStep(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update step');
    } finally {
      setSaving(false);
    }
  };

  const getConditionsDisplay = (conditions: Json) => {
    if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) return 'Always shown';
    const obj = conditions as Record<string, unknown>;
    if (Object.keys(obj).length === 0) return 'Always shown';
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Onboarding Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Onboarding Steps
                </CardTitle>
                <CardDescription>
                  View and edit onboarding content. Changes apply to future users only.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {onboardingSteps.map((step, index) => (
              <div 
                key={step.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-sm font-mono w-6 text-center">{step.step_order}</span>
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{step.step_name}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {step.step_key}
                    </Badge>
                    {!step.is_active && (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  
                  {step.content_title && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Title:</strong> {step.content_title}
                    </p>
                  )}
                  {step.content_description && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Description:</strong> {step.content_description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {getConditionsDisplay(step.conditions)}
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEditClick(step)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* App Flow Steps (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Setup Wizard Flow
            </CardTitle>
            <CardDescription>
              View the step-by-step flow logic for the setup wizard. (Read-only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appFlowSteps
                .filter(step => step.flow_name === 'setup_wizard')
                .map((step, index, arr) => (
                  <div 
                    key={step.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <span className="text-sm font-mono w-6 text-center text-muted-foreground">
                      {step.step_order}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{step.step_name}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {step.step_key}
                        </Badge>
                      </div>
                      {step.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      )}
                      {step.conditions && typeof step.conditions === 'object' && !Array.isArray(step.conditions) && Object.keys(step.conditions).length > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Condition: {JSON.stringify(step.conditions)}
                        </p>
                      )}
                    </div>
                    {step.next_step_key && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                        <Badge variant="secondary">{step.next_step_key}</Badge>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Step: {editingStep?.step_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Step Enabled</Label>
              <Switch
                id="is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_title">Title</Label>
              <Input
                id="content_title"
                value={editForm.content_title}
                onChange={(e) => setEditForm(prev => ({ ...prev, content_title: e.target.value }))}
                placeholder="Step title shown to users"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_description">Description</Label>
              <Input
                id="content_description"
                value={editForm.content_description}
                onChange={(e) => setEditForm(prev => ({ ...prev, content_description: e.target.value }))}
                placeholder="Brief description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_body">Body Content (optional)</Label>
              <Textarea
                id="content_body"
                value={editForm.content_body}
                onChange={(e) => setEditForm(prev => ({ ...prev, content_body: e.target.value }))}
                placeholder="Additional content or instructions"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStep} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}