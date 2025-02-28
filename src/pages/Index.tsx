import React, { useState, useEffect } from "react";
import { InvoiceForm } from "@/components/InvoiceForm";
import { InvoicePreview } from "@/components/InvoicePreview";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { TemplateSelector } from "@/components/TemplateSelector";
import { Footer } from "@/components/Footer";
import { AdContainer } from "@/components/AdContainer";
import { loadAndExecuteAds } from "@/utils/adManager";
import { getAdminSettings, subscribeToAdminSettings } from "@/utils/adminSettings";

const Index = () => {
  const { toast } = useToast();
  const [invoiceData, setInvoiceData] = useState({
    companyName: "",
    clientName: "",
    clientAddress: "",
    bankName: "",
    accountNumber: "",
    invoiceNumber: "",
    invoiceDate: "",
    lineItems: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 6 }],
  });
  const [template, setTemplate] = useState("modern");

  useEffect(() => {
    // Initial load of admin settings
    const settings = getAdminSettings();
    setInvoiceData(prev => ({
      ...prev,
      bankName: settings.bankName,
      accountNumber: settings.accountNumber,
    }));

    // Subscribe to admin settings changes
    const unsubscribe = subscribeToAdminSettings((newSettings) => {
      console.log("Admin settings updated, updating invoice data");
      setInvoiceData(prev => ({
        ...prev,
        bankName: newSettings.bankName,
        accountNumber: newSettings.accountNumber,
      }));
      loadAndExecuteAds();
    });

    // Initial load of ads
    const timeoutId = setTimeout(() => {
      loadAndExecuteAds();
    }, 2000);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleExportPDF = async () => {
    const element = document.getElementById("invoice-preview");
    if (!element) return;

    try {
      // Remove borders temporarily for PDF generation
      const originalStyle = element.style.cssText;
      element.style.border = 'none';
      element.style.boxShadow = 'none';
      
      // Set specific dimensions for A4
      const a4Width = 210; // mm
      const a4Height = 297; // mm
      const pixelsPerMm = 3.78; // Standard 96 DPI converted to mm
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: a4Width * pixelsPerMm,
        height: a4Height * pixelsPerMm,
        windowWidth: a4Width * pixelsPerMm,
        windowHeight: a4Height * pixelsPerMm,
      });

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calculate positioning to center content
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, a4Width, a4Height, '', 'FAST');
      
      // Restore original styling
      element.style.cssText = originalStyle;
      
      pdf.save("invoice.pdf");
      
      toast({
        title: "Success",
        description: "Invoice exported as PDF",
      });
    } catch (error) {
      console.error("PDF export failed:", error);
      toast({
        title: "Export failed",
        description: "Could not export invoice to PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#1e3a8a] mb-8">
          Invoice Generator
        </h1>

        <AdContainer position="top" className="mb-8" />

        <div className="mb-4">
          <TemplateSelector 
            currentTemplate={template}
            onTemplateChange={setTemplate}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="w-full">
            <InvoiceForm onUpdateInvoice={setInvoiceData} />
          </div>
          <div className="w-full">
            <div className="sticky top-8 overflow-x-auto">
              <div id="invoice-preview" className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
                <InvoicePreview {...invoiceData} template={template} />
              </div>
              <div className="mt-4 flex gap-4 justify-end">
                <Button 
                  onClick={handleExportPDF}
                  className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                >
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        <AdContainer position="bottom" className="mt-8" />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
