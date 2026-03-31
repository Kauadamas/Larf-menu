import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChefHat,
  Edit2,
  FileImage,
  FileText,
  Languages,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

type ExtractedItem = {
  namePt: string;
  nameEs: string;
  nameEn: string;
  descriptionPt: string;
  descriptionEs: string;
  descriptionEn: string;
  priceBrl: string;
};

type ExtractedCategory = {
  namePt: string;
  nameEs: string;
  nameEn: string;
  items: ExtractedItem[];
};

type Step = "upload" | "analyzing" | "review" | "importing" | "done";

export default function SmartImport() {
  const { user, isAuthenticated, logout } = useAuth();
  const params = useParams<{ companyId: string }>();
  const companyId = parseInt(params.companyId ?? "0");
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<ExtractedCategory[]>([]);
  const [editingItem, setEditingItem] = useState<{ catIdx: number; itemIdx: number } | null>(null);
  const [importResult, setImportResult] = useState<{ totalCategories: number; totalItems: number } | null>(null);

  const utils = trpc.useUtils();
  const { data: company } = trpc.companies.getById.useQuery(
    { id: companyId },
    { enabled: !!companyId && isAuthenticated }
  );

  const translateMutation = trpc.translation.translateBatch.useMutation({
    onSuccess: (data, variables) => {
      // Apply translations to all categories or a specific item
      toast.success("Tradução aplicada!");
    },
    onError: (e) => toast.error(`Erro na tradução: ${e.message}`),
  });

  const analyzeMutation = trpc.import.analyze.useMutation({
    onSuccess: (data) => {
      const mapped: ExtractedCategory[] = data.categories.map((cat) => ({
        namePt: cat.namePt,
        nameEs: "",
        nameEn: "",
        items: cat.items.map((item) => ({
          namePt: item.namePt,
          nameEs: "",
          nameEn: "",
          descriptionPt: item.descriptionPt ?? "",
          descriptionEs: "",
          descriptionEn: "",
          priceBrl: item.priceBrl ?? "0.00",
        })),
      }));
      setCategories(mapped);
      setStep("review");
      toast.success(`${data.categories.length} categorias extraídas com sucesso!`);
    },
    onError: (e) => {
      setStep("upload");
      toast.error("Erro na análise: " + e.message);
    },
  });

  const confirmMutation = trpc.import.confirm.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      setStep("done");
      utils.categories.list.invalidate({ companyId });
      utils.menuItems.list.invalidate({ companyId });
      toast.success(`Importação concluída! ${data.totalCategories} categorias e ${data.totalItems} itens criados.`);
    },
    onError: (e) => {
      setStep("review");
      toast.error("Erro ao importar: " + e.message);
    },
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato não suportado. Use PDF, JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 20MB.");
      return;
    }
    setSelectedFile(file);
  }

  function handleAnalyze() {
    if (!selectedFile) return;
    setStep("analyzing");
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      analyzeMutation.mutate({
        companyId,
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        base64,
      });
    };
    reader.readAsDataURL(selectedFile);
  }

  async function handleTranslateAll() {
    const fields: { key: string; text: string }[] = [];
    categories.forEach((cat, ci) => {
      fields.push({ key: `cat_${ci}`, text: cat.namePt });
      cat.items.forEach((item, ii) => {
        fields.push({ key: `item_${ci}_${ii}_name`, text: item.namePt });
        if (item.descriptionPt.trim()) {
          fields.push({ key: `item_${ci}_${ii}_desc`, text: item.descriptionPt });
        }
      });
    });

    try {
      const result = await translateMutation.mutateAsync({ fields, targets: ["es", "en"] });
      setCategories((prev) =>
        prev.map((cat, ci) => ({
          ...cat,
          nameEs: result[`cat_${ci}`]?.["es"] ?? cat.nameEs,
          nameEn: result[`cat_${ci}`]?.["en"] ?? cat.nameEn,
          items: cat.items.map((item, ii) => ({
            ...item,
            nameEs: result[`item_${ci}_${ii}_name`]?.["es"] ?? item.nameEs,
            nameEn: result[`item_${ci}_${ii}_name`]?.["en"] ?? item.nameEn,
            descriptionEs: result[`item_${ci}_${ii}_desc`]?.["es"] ?? item.descriptionEs,
            descriptionEn: result[`item_${ci}_${ii}_desc`]?.["en"] ?? item.descriptionEn,
          })),
        }))
      );
    } catch {
      // error already shown by mutation
    }
  }

  function handleConfirmImport() {
    setStep("importing");
    confirmMutation.mutate({ companyId, categories });
  }

  function removeCategory(ci: number) {
    setCategories((prev) => prev.filter((_, i) => i !== ci));
  }

  function removeItem(ci: number, ii: number) {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === ci ? { ...cat, items: cat.items.filter((_, j) => j !== ii) } : cat
      )
    );
  }

  function updateCategoryName(ci: number, field: keyof Pick<ExtractedCategory, "namePt" | "nameEs" | "nameEn">, value: string) {
    setCategories((prev) =>
      prev.map((cat, i) => (i === ci ? { ...cat, [field]: value } : cat))
    );
  }

  function updateItem(ci: number, ii: number, field: keyof ExtractedItem, value: string) {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === ci
          ? {
              ...cat,
              items: cat.items.map((item, j) =>
                j === ii ? { ...item, [field]: value } : item
              ),
            }
          : cat
      )
    );
  }

  if (!isAuthenticated) { window.location.replace("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/companies/${companyId}/items`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Importação Inteligente</span>
            {company && (
              <Badge variant="secondary" className="text-xs">{company.name}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            <div className="text-center">
              <Bot className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Importar Cardápio com IA</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Envie o PDF ou imagem do seu cardápio. A IA vai extrair automaticamente todas as categorias, pratos, descrições e preços.
              </p>
            </div>

            <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              <CardContent className="py-12 text-center">
                {selectedFile ? (
                  <div className="space-y-3">
                    {selectedFile.type === "application/pdf" ? (
                      <FileText className="h-12 w-12 text-primary mx-auto" />
                    ) : (
                      <FileImage className="h-12 w-12 text-primary mx-auto" />
                    )}
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — {selectedFile.type}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Trocar arquivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                    <p className="font-medium text-foreground">Clique para selecionar o arquivo</p>
                    <p className="text-sm text-muted-foreground">PDF, JPG, PNG ou WebP — máximo 20MB</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">O que a IA extrai automaticamente:</p>
              <p>✅ Categorias do cardápio (Entradas, Pratos, Bebidas...)</p>
              <p>✅ Nome de cada prato em Português</p>
              <p>✅ Descrição dos pratos (se disponível no documento)</p>
              <p>✅ Preços em R$ (se visíveis)</p>
              <p>⚠️ Fotos dos pratos precisam ser adicionadas manualmente depois</p>
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={!selectedFile}
                className="px-8"
              >
                <Bot className="h-5 w-5 mr-2" />
                Analisar com IA
              </Button>
            </div>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === "analyzing" && (
          <div className="text-center py-20 space-y-6">
            <div className="relative">
              <Bot className="h-20 w-20 text-primary mx-auto" />
              <Loader2 className="h-8 w-8 text-primary animate-spin absolute -bottom-2 -right-2 mx-auto" style={{ left: "calc(50% + 20px)" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Analisando seu cardápio...</h2>
              <p className="text-muted-foreground">A IA está lendo o documento e extraindo todos os itens.</p>
              <p className="text-sm text-muted-foreground mt-1">Isso pode levar 15-30 segundos.</p>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">Revisar Extração</h2>
                <p className="text-sm text-muted-foreground">
                  {categories.length} categorias · {categories.reduce((s, c) => s + c.items.length, 0)} itens extraídos
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTranslateAll}
                  disabled={translateMutation.isPending}
                >
                  <Languages className="h-4 w-4 mr-2" />
                  {translateMutation.isPending ? "Traduzindo..." : "Traduzir tudo (ES + EN)"}
                </Button>
                <Button onClick={handleConfirmImport} disabled={categories.length === 0}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Importação
                </Button>
              </div>
            </div>

            {categories.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma categoria extraída. Tente com outro arquivo.
                </CardContent>
              </Card>
            )}

            {categories.map((cat, ci) => (
              <Card key={ci} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Categoria</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">PT</Label>
                          <Input
                            value={cat.namePt}
                            onChange={(e) => updateCategoryName(ci, "namePt", e.target.value)}
                            className="h-8 text-sm mt-0.5"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">ES</Label>
                          <Input
                            value={cat.nameEs}
                            onChange={(e) => updateCategoryName(ci, "nameEs", e.target.value)}
                            placeholder="(traduzir)"
                            className="h-8 text-sm mt-0.5"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">EN</Label>
                          <Input
                            value={cat.nameEn}
                            onChange={(e) => updateCategoryName(ci, "nameEn", e.target.value)}
                            placeholder="(translate)"
                            className="h-8 text-sm mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => removeCategory(ci)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {cat.items.map((item, ii) => (
                    <div key={ii} className="bg-muted/40 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Nome PT</Label>
                            <Input
                              value={item.namePt}
                              onChange={(e) => updateItem(ci, ii, "namePt", e.target.value)}
                              className="h-7 text-sm mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Nombre ES</Label>
                            <Input
                              value={item.nameEs}
                              onChange={(e) => updateItem(ci, ii, "nameEs", e.target.value)}
                              placeholder="(traduzir)"
                              className="h-7 text-sm mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Name EN</Label>
                            <Input
                              value={item.nameEn}
                              onChange={(e) => updateItem(ci, ii, "nameEn", e.target.value)}
                              placeholder="(translate)"
                              className="h-7 text-sm mt-0.5"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0 mt-4"
                          onClick={() => removeItem(ci, ii)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <Label className="text-xs">Descrição PT</Label>
                          <Textarea
                            value={item.descriptionPt}
                            onChange={(e) => updateItem(ci, ii, "descriptionPt", e.target.value)}
                            rows={2}
                            className="text-sm mt-0.5 resize-none"
                            placeholder="Descrição..."
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Preço (R$)</Label>
                          <Input
                            value={item.priceBrl}
                            onChange={(e) => updateItem(ci, ii, "priceBrl", e.target.value)}
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8 text-sm mt-0.5"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full border border-dashed border-border text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setCategories((prev) =>
                        prev.map((c, i) =>
                          i === ci
                            ? {
                                ...c,
                                items: [
                                  ...c.items,
                                  { namePt: "", nameEs: "", nameEn: "", descriptionPt: "", descriptionEs: "", descriptionEn: "", priceBrl: "0.00" },
                                ],
                              }
                            : c
                        )
                      )
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Adicionar item
                  </Button>
                </CardContent>
              </Card>
            ))}

            {categories.length > 0 && (
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Recomeçar
                </Button>
                <Button onClick={handleConfirmImport} size="lg">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Importação ({categories.reduce((s, c) => s + c.items.length, 0)} itens)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="text-center py-20 space-y-6">
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Importando...</h2>
              <p className="text-muted-foreground">Criando categorias e itens no seu cardápio.</p>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && importResult && (
          <div className="text-center py-20 space-y-6">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Importação concluída!</h2>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{importResult.totalCategories}</span> categorias e{" "}
                <span className="font-semibold text-foreground">{importResult.totalItems}</span> itens foram criados com sucesso.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => { setStep("upload"); setSelectedFile(null); setCategories([]); }}>
                Importar outro cardápio
              </Button>
              <Button onClick={() => navigate(`/admin/companies/${companyId}/items`)}>
                Ver Cardápio
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
