"use client";

import { useState, useEffect } from "react";
import { MapPin, Clock, Navigation, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RelayPoint } from "@/types";

interface RelayPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (relayPoint: RelayPoint) => void;
  postalCode?: string;
}

export function RelayPointModal({
  isOpen,
  onClose,
  onSelect,
  postalCode: initialPostalCode,
}: RelayPointModalProps) {
  const [searchPostalCode, setSearchPostalCode] = useState(
    initialPostalCode || ""
  );
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<RelayPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialPostalCode) {
      fetchRelayPoints(initialPostalCode);
    }
  }, [isOpen, initialPostalCode]);

  const fetchRelayPoints = async (postalCode: string) => {
    if (!postalCode || postalCode.length !== 5) {
      setError("Veuillez saisir un code postal valide (5 chiffres)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/checkout/relay-points?postalCode=${postalCode}&limit=10`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des points relais");
      }

      const data = await response.json();

      if (data.success && data.data) {
        setRelayPoints(data.data);
        if (data.data.length === 0) {
          setError("Aucun point relais trouvé dans cette zone");
        }
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
      setRelayPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRelayPoints(searchPostalCode);
  };

  const handleSelectPoint = (point: RelayPoint) => {
    setSelectedPoint(point);
  };

  const handleConfirm = () => {
    if (selectedPoint) {
      onSelect(selectedPoint);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choisir un point relais</DialogTitle>
          <DialogDescription>
            Sélectionnez le point relais le plus proche de chez vous
          </DialogDescription>
        </DialogHeader>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nuanced-500" />
            <Input
              type="text"
              value={searchPostalCode}
              onChange={(e) => setSearchPostalCode(e.target.value)}
              placeholder="Code postal"
              className="pl-10"
              maxLength={5}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Recherche..." : "Rechercher"}
          </Button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Map Placeholder */}
          <div className="hidden lg:block w-1/2 rounded-lg border border-platinum-200 bg-platinum-50">
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-nuanced-500">
                <MapPin className="mx-auto h-12 w-12 mb-2" />
                <p className="text-sm">Carte interactive</p>
                <p className="text-xs">(intégration en cours)</p>
              </div>
            </div>
          </div>

          {/* Relay Points List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {relayPoints.length === 0 && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-nuanced-500">
                <Navigation className="h-12 w-12 mb-2" />
                <p className="text-sm">
                  Entrez un code postal pour trouver des points relais
                </p>
              </div>
            )}

            {relayPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => handleSelectPoint(point)}
                className={cn(
                  "w-full rounded-lg border-2 p-4 text-left transition-all hover:border-orange-300 hover:bg-orange-50",
                  selectedPoint?.id === point.id
                    ? "border-orange-500 bg-orange-50"
                    : "border-platinum-200 bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <h4 className="font-semibold text-anthracite-700">
                        {point.name}
                      </h4>
                    </div>

                    <p className="text-sm text-nuanced-600 mb-2">
                      {point.address}
                      <br />
                      {point.postalCode} {point.city}
                    </p>

                    {point.openingHours && point.openingHours.length > 0 && (
                      <div className="flex items-start gap-2 text-xs text-nuanced-500">
                        <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          {point.openingHours.slice(0, 2).map((hours, idx) => (
                            <div key={idx}>{hours}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                      {point.distance.toFixed(1)} km
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-platinum-200 pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPoint}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Confirmer ce point relais
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
