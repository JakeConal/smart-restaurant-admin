"use client";

import React, { useState } from "react";
import { Modal, Button, useToast } from "@/components/ui";
import { Download, QrCode as QrCodeIcon } from "lucide-react";
import type { Table } from "@/types/table";
import { tablesApi } from "@/lib/api/tables";

export interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  onRegenerate?: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  table,
  onRegenerate,
}) => {
  const toast = useToast();
  const [downloading, setDownloading] = useState<"png" | "pdf" | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const qrCodeUrl = table.qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/menu?table=${table.id}&token=${
          table.qrToken
        }`,
      )}`
    : "";

  const handleDownloadPNG = async () => {
    setDownloading("png");
    try {
      await tablesApi.downloadQRPNG(table.id);
    } catch (error) {
      console.error("Failed to download PNG:", error);
      toast.error("Failed to download QR code");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading("pdf");
    try {
      await tablesApi.downloadQRPDF(table.id);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download QR code");
    } finally {
      setDownloading(null);
    }
  };

  const handleRegenerate = async () => {
    const isNew = !table.qrToken;
    if (
      !isNew &&
      !confirm(
        "Are you sure you want to regenerate this QR code? The old code will become invalid.",
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      await tablesApi.regenerateQR(table.id);
      onRegenerate?.();
      if (!isNew) {
        toast.success("QR code regenerated successfully!");
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      toast.error(`Failed to ${isNew ? "generate" : "regenerate"} QR code`);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" padding="p-6">
      <div className="text-center">
        {/* Icon */}
        <div className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
          <QrCodeIcon className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-gray-900 mb-1">
          Scan to Order
        </h3>
        <p className="text-gray-500 text-sm font-medium mb-5">
          {table.tableNumber} • {table.location || "Main Hall"}
        </p>

        {/* QR Code */}
        {qrCodeUrl ? (
          <div className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100 inline-block mb-5">
            <img
              src={qrCodeUrl}
              alt={`QR Code for ${table.tableNumber}`}
              className="w-40 h-40 rounded-xl mix-blend-multiply opacity-90"
            />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 inline-block mb-5">
            <div className="w-40 h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl">
              <QrCodeIcon className="w-10 h-10 text-gray-200 mb-2" />
              <p className="text-gray-400 text-xs">No QR code generated yet</p>
            </div>
          </div>
        )}

        {/* Token Info */}
        {table.qrTokenCreatedAt && (
          <p className="text-[10px] text-gray-400 mb-4">
            Generated: {new Date(table.qrTokenCreatedAt).toLocaleString()}
          </p>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            variant="primary"
            onClick={handleDownloadPDF}
            loading={downloading === "pdf"}
            disabled={!table.qrToken || downloading !== null}
            icon={Download}
            className="h-10 text-sm"
          >
            Download PDF
          </Button>
          <Button
            variant="primary"
            onClick={handleDownloadPNG}
            loading={downloading === "png"}
            disabled={!table.qrToken || downloading !== null}
            icon={Download}
            className="h-10 text-sm"
          >
            Download PNG
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={handleRegenerate}
            loading={regenerating}
            disabled={regenerating}
            className="h-10 text-sm"
          >
            {table.qrToken ? "Regenerate" : "Generate"}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className="h-10 text-sm"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
