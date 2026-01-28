"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, X, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface WidgetWrapperProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: "full" | "half";
  visible?: boolean;
  isEditMode?: boolean;
  onToggleVisibility?: () => void;
  onToggleWidth?: () => void;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  columnSpan?: number;
  onChangeColumnSpan?: (span: number) => void;
  className?: string;
}

export function WidgetWrapper({
  id,
  title,
  description,
  icon,
  children,
  width = "full",
  visible = true,
  isEditMode = false,
  onToggleVisibility,
  onToggleWidth,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  columnSpan,
  onChangeColumnSpan,
  className,
}: WidgetWrapperProps) {
  if (!visible && !isEditMode) {
    return null;
  }

  return (
    <Card
      className={cn(
        "transition-all w-full",
        !visible && isEditMode && "opacity-50",
        className
      )}
      data-widget-id={id}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            {icon && <div className="mt-0.5">{icon}</div>}
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm mt-1">{description}</CardDescription>
              )}
            </div>
          </div>

          {isEditMode && (
            <div className="flex items-center gap-1">
              {onMoveUp && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
              {onMoveDown && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}
              {onToggleVisibility && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onToggleVisibility}
                  title={visible ? "Hide widget" : "Show widget"}
                >
                  {visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              )}
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onRemove}
                  className="text-destructive hover:text-destructive"
                  title="Remove widget"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {isEditMode && onChangeColumnSpan && (
          <div className="flex items-center gap-2 mt-3">
            <Label className="text-xs text-muted-foreground">
              Column span:
            </Label>
            <Select
              value={String(columnSpan || 6)}
              onValueChange={(value) => onChangeColumnSpan(Number(value))}
            >
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
