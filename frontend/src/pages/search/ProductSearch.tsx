import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useCart } from '../../session/CartContext';
import { StorefrontHeader } from '../../shared/StorefrontHeader';
import { CategoryImage } from '../../shared/CategoryImage';
import { searchCatalogProducts } from '../../services/catalog/pipesFittingRepository';
import type { SearchCatalogProduct } from '../../services/catalog/pipesFittingRepository';
import type { ProductVariant } from '../../services/catalog/catalogModels';

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface BrowserWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  BarcodeDetector?: new (options: { formats: string[] }) => {
    detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
  };
}

const Page = styled.div`
  min-height: 100%;
  background: ${({ theme }) => theme.colors.surface};
`;

const Content = styled.main`
  width: min(100%, 1200px);
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.space6}px;
`;

const Heading = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing.space4}px;
  color: ${({ theme }) => theme.colors.onSurface};
  font-size: 28px;
`;

const SearchForm = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.space2}px;
  max-width: 760px;
`;

const SearchInput = styled.input`
  min-width: 0;
  flex: 1;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md}px;
  color: ${({ theme }) => theme.colors.onSurface};
  background: ${({ theme }) => theme.colors.surface};
  font: inherit;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.onSurface};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const PrimaryButton = styled(ActionButton)`
  border-color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
    opacity: 0.9;
  }
`;

const Toolbar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.space2}px;
`;

const Message = styled.p<{ $error?: boolean }>`
  margin: ${({ theme }) => theme.spacing.space4}px 0;
  color: ${({ $error, theme }) => ($error ? theme.colors.error : theme.colors.onSurfaceVariant)};
`;

const Results = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.space4}px;
  margin-top: ${({ theme }) => theme.spacing.space5}px;
`;

const ProductCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.space3}px;
  padding: ${({ theme }) => theme.spacing.space3}px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const ProductImage = styled.div`
  height: 210px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background: ${({ theme }) => theme.colors.surfaceContainer};
`;

const ProductName = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.onSurface};
  font-size: 16px;
`;

const ProductMeta = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 13px;
`;

const ProductFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
`;

const Price = styled.strong`
  color: ${({ theme }) => theme.colors.onSurface};
`;

const ScannerBackdrop = styled.div`
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 65%);
`;

const ScannerPanel = styled.section`
  width: min(100%, 560px);
  padding: 20px;
  border-radius: ${({ theme }) => theme.radius.lg}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const ScannerVideo = styled.video`
  width: 100%;
  max-height: 55vh;
  margin: 12px 0;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background: #111;
`;

const ScannerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

function productVariant(product: SearchCatalogProduct): ProductVariant {
  const specifications: Record<string, string> = {};
  if (product.size) specifications.Size = product.size;
  if (product.length) specifications.Length = product.length;
  if (product.stdPkg) specifications['Std. Packaging'] = product.stdPkg;

  return {
    id: `catalog-${product.id}`,
    productId: product.id,
    productName: product.productName,
    sku: product.productCode ?? '',
    brandId: product.brandId ?? product.brand.toLowerCase(),
    brandName: product.brand,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    subCategoryId: product.subcategoryId,
    subCategoryName: product.subcategoryName,
    description: [product.type, product.className].filter(Boolean).join(' '),
    price: product.mrp,
    unit: product.unit,
    icon: 'plumbing',
    rating: 0,
    reviewCount: 0,
    stockStatus: 'inStock',
    specifications,
    imageAsset: product.imageUrl ?? '',
    mrp: product.mrp,
    minimumOrderQuantity: 1,
  };
}

export function ProductSearch() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { addVariant } = useCart();
  const routeState = location.state as { searchMode?: 'voice' | 'scan'; query?: string } | null;
  const [query, setQuery] = useState(routeState?.query ?? '');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [products, setProducts] = useState<SearchCatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const runSearch = useCallback(async (searchTerm: string) => {
    const value = searchTerm.trim();
    if (!value) {
      setError('Enter a product, brand, or product code to search.');
      setProducts([]);
      setSubmittedQuery('');
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    setNotice(null);
    setSubmittedQuery(value);
    try {
      const results = await searchCatalogProducts(value, controller.signal);
      if (!controller.signal.aborted) setProducts(results);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Product search failed.');
        setProducts([]);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const startVoiceSearch = useCallback(() => {
    const browser = window as BrowserWindow;
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice('Voice search is not supported in this browser. Use the text search instead.');
      return;
    }
    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        setNotice('No words were recognized. Try voice search again.');
        return;
      }
      setQuery(transcript);
      void runSearch(transcript);
    };
    recognition.onerror = (event) => {
      setNotice(`Voice search failed: ${event.error}. You can still search by typing.`);
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setNotice('Listening… Say a product name, brand, or code.');
    try {
      recognition.start();
    } catch (cause) {
      recognitionRef.current = null;
      setNotice(cause instanceof Error ? cause.message : 'Could not start voice search.');
    }
  }, [runSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (routeState?.query) void runSearch(routeState.query);
      if (routeState?.searchMode === 'voice') startVoiceSearch();
      if (routeState?.searchMode === 'scan') setScannerOpen(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controllerRef.current?.abort();
      recognitionRef.current?.stop();
    };
  }, [routeState?.query, routeState?.searchMode, runSearch, startVoiceSearch]);

  useEffect(() => {
    if (!scannerOpen) return;
    const videoElement = videoRef.current;
    const Detector = (window as BrowserWindow).BarcodeDetector;
    if (!Detector) {
      const timer = window.setTimeout(
        () =>
          setScannerError(
            'Barcode scanning is not supported by this browser. Search by product code instead.',
          ),
        0,
      );
      return () => window.clearTimeout(timer);
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      const timer = window.setTimeout(
        () => setScannerError('Camera access is not available. Search by product code instead.'),
        0,
      );
      return () => window.clearTimeout(timer);
    }

    let active = true;
    let stream: MediaStream | null = null;
    let animationFrame = 0;
    const detector = new Detector({
      formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
    });

    const scanFrame = async () => {
      if (
        !active ||
        !videoElement ||
        videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        if (active) animationFrame = requestAnimationFrame(() => void scanFrame());
        return;
      }
      try {
        const codes = await detector.detect(videoElement);
        const value = codes[0]?.rawValue?.trim();
        if (value) {
          setQuery(value);
          setScannerOpen(false);
          void runSearch(value);
          return;
        }
        animationFrame = requestAnimationFrame(() => void scanFrame());
      } catch (cause) {
        if (active) {
          setScannerError(
            cause instanceof Error
              ? `Could not read barcode: ${cause.message}`
              : 'Could not read barcode.',
          );
          setScannerOpen(false);
        }
      }
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(async (mediaStream) => {
        stream = mediaStream;
        if (!active || !videoElement) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        videoElement.srcObject = mediaStream;
        await videoElement.play();
        animationFrame = requestAnimationFrame(() => void scanFrame());
      })
      .catch((cause: unknown) => {
        if (active) {
          setScannerError(
            cause instanceof Error
              ? `Camera could not be started: ${cause.message}`
              : 'Camera could not be started.',
          );
          setScannerOpen(false);
        }
      });

    return () => {
      active = false;
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoElement) videoElement.srcObject = null;
    };
  }, [scannerOpen, runSearch]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(query);
  };

  return (
    <Page>
      <StorefrontHeader sticky={false} />
      <Content>
        <Heading>Search products</Heading>
        <SearchForm onSubmit={submitSearch}>
          <SearchInput
            autoFocus
            type="search"
            aria-label="Search products, brands, or product codes"
            placeholder="Search products, brands, or product codes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Toolbar>
            <ActionButton
              type="button"
              title="Voice search"
              aria-label="Voice search"
              onClick={startVoiceSearch}
            >
              <i className="pi pi-microphone" aria-hidden="true" />
            </ActionButton>
            <ActionButton
              type="button"
              title="Scan barcode"
              aria-label="Scan barcode"
              onClick={() => {
                setScannerError(null);
                setScannerOpen(true);
              }}
            >
              <i className="pi pi-qrcode" aria-hidden="true" />
            </ActionButton>
            <PrimaryButton type="submit" disabled={loading}>
              <i className="pi pi-search" aria-hidden="true" />
              Search
            </PrimaryButton>
          </Toolbar>
        </SearchForm>

        {notice && <Message role="status">{notice}</Message>}
        {error && (
          <Message $error role="alert">
            {error}
          </Message>
        )}
        {loading && <Message role="status">Searching the live catalog…</Message>}
        {!loading && !error && submittedQuery && products.length === 0 && (
          <Message role="status">No products found for “{submittedQuery}”.</Message>
        )}
        {products.length > 0 && (
          <>
            <Message role="status">
              {products.length} live result{products.length === 1 ? '' : 's'} for “{submittedQuery}”
            </Message>
            <Results>
              {products.map((product) => (
                <ProductCard key={product.id}>
                  <ProductImage>
                    <CategoryImage
                      imageAsset={product.imageUrl ?? ''}
                      fallbackIcon="pi-wrench"
                      fallbackIconColor={theme.colors.outline}
                      fallbackBackground={theme.colors.surfaceContainer}
                      fit="contain"
                      radius={theme.radius.md}
                      iconSize={theme.spacing.space8}
                    />
                  </ProductImage>
                  <ProductName>{product.productName}</ProductName>
                  <ProductMeta>
                    {[product.brand, product.categoryName, product.subcategoryName]
                      .filter(Boolean)
                      .join(' · ')}
                  </ProductMeta>
                  <ProductFooter>
                    <Price>
                      ₹{product.mrp.toLocaleString('en-IN')} / {product.unit}
                    </Price>
                    <PrimaryButton
                      type="button"
                      onClick={() => {
                        addVariant(productVariant(product));
                        setNotice(`${product.productName} added to your cart.`);
                      }}
                    >
                      Add to cart
                    </PrimaryButton>
                  </ProductFooter>
                </ProductCard>
              ))}
            </Results>
          </>
        )}
      </Content>

      {scannerOpen && (
        <ScannerBackdrop>
          <ScannerPanel aria-label="Barcode scanner">
            <ScannerHeader>
              <strong>Scan a product barcode</strong>
              <ActionButton type="button" onClick={() => setScannerOpen(false)}>
                Close
              </ActionButton>
            </ScannerHeader>
            {scannerError ? (
              <Message $error role="alert">
                {scannerError}
              </Message>
            ) : (
              <Message role="status">Point your camera at a product barcode or QR code.</Message>
            )}
            <ScannerVideo ref={videoRef} autoPlay playsInline muted />
          </ScannerPanel>
        </ScannerBackdrop>
      )}
      {scannerError && !scannerOpen && (
        <Message $error role="alert">
          {scannerError}
        </Message>
      )}

      <ActionButton type="button" onClick={() => navigate(-1)}>
        Back
      </ActionButton>
    </Page>
  );
}
