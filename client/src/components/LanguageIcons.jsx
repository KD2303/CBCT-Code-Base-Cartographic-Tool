import React from 'react';
import { cn } from '@/lib/utils';

// Import custom icons from assets
import pythonSvg from '../assets/icons/python.svg';
import javascriptSvg from '../assets/icons/javascript.svg';
import typescriptSvg from '../assets/icons/typescript.svg';
import javaSvg from '../assets/icons/java.svg';
import cppSvg from '../assets/icons/cpp.svg';
import cSvg from '../assets/icons/c.svg';
import goSvg from '../assets/icons/go.svg';
import rustSvg from '../assets/icons/rust.svg';
import phpPng from '../assets/icons/php.png';
import rubySvg from '../assets/icons/ruby.svg';
import kotlinSvg from '../assets/icons/kotlin.svg';
import bashSvg from '../assets/icons/bash.svg';
import dartSvg from '../assets/icons/dart.svg';
import haskellSvg from '../assets/icons/haskell.svg';
import csharpSvg from '../assets/icons/csharp.svg';

// Custom Asset Icons (from user)
export const PythonIcon = ({ className }) => <img src={pythonSvg} className={cn("object-contain", className)} alt="Python" />;
export const JSIcon = ({ className }) => <img src={javascriptSvg} className={cn("object-contain", className)} alt="JS" />;
export const TSIcon = ({ className }) => <img src={typescriptSvg} className={cn("object-contain", className)} alt="TS" />;
export const JavaIcon = ({ className }) => <img src={javaSvg} className={cn("object-contain", className)} alt="Java" />;
export const CppIcon = ({ className }) => <img src={cppSvg} className={cn("object-contain", className)} alt="C++" />;
export const CIcon = ({ className }) => <img src={cSvg} className={cn("object-contain", className)} alt="C" />;
export const GoIcon = ({ className }) => <img src={goSvg} className={cn("object-contain", className)} alt="Go" />;
export const RustIcon = ({ className }) => <img src={rustSvg} className={cn("object-contain", className)} alt="Rust" />;
export const PHPIcon = ({ className }) => <img src={phpPng} className={cn("object-contain", className)} alt="PHP" />;
export const RubyIcon = ({ className }) => <img src={rubySvg} className={cn("object-contain", className)} alt="Ruby" />;
export const KotlinIcon = ({ className }) => <img src={kotlinSvg} className={cn("object-contain", className)} alt="Kotlin" />;
export const ShellIcon = ({ className }) => <img src={bashSvg} className={cn("object-contain", className)} alt="Shell" />;
export const DartIcon = ({ className }) => <img src={dartSvg} className={cn("object-contain", className)} alt="Dart" />;
export const HaskellIcon = ({ className }) => <img src={haskellSvg} className={cn("object-contain", className)} alt="Haskell" />;
export const CSharpIcon = ({ className }) => <img src={csharpSvg} className={cn("object-contain", className)} alt="C#" />;

// Built-in SVG Icons (preserving previous implementations)
export const ReactIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="2" />
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
            <ellipse cx="12" cy="12" rx="10" ry="4" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </g>
    </svg>
);

export const HTMLIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l.232-2.718 10.125.003L18.398 4.75H5.805l.758 8.848h9.872l-.37 4.128-4.088 1.103-4.135-1.122-.263-2.922H4.95l.487 5.484 6.541 1.815 6.643-1.841 1.05-11.773H8.531z" />
    </svg>
);

export const CSSIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M3.6 3h16.8l-1.5 17.2-6.9 1.8-6.9-1.8L3.6 3zm3.7 3l.2 2.1h6.7l-.1 1.4H7.6l.2 2.1h5.3l-.5 5.2-3.6 1-3.6-1-.2-2.1H3l.4 4.1L12 21l8.6-2.4 1.1-12.6H7.3z" />
    </svg>
);

export const JSONIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M5 5c-1.1 0-2 .9-2 2v2.5c0 .8-.5 1.5-1.2 1.8-.1.1-.3.3-.3.3v.8s.2.2.3.3c.7.3 1.2 1 1.2 1.8V17c0 1.1.9 2 2 2 .6 0 1-.4 1-1s-.4-1-1-1c0-1.7-.1-1.6-.8-1.9-.6-.2-.6-.9 0-1.1.7-.3.8-.2.8-1.9 0-.6.4-1 1-1s1 .4 1 1zm14 0c-.6 0-1 .4-1 1s.4 1 1 1c0 1.7.1 1.6.8 1.9.6.2.6.9 0 1.1-.7.3-.8.2-.8 1.9 0 .6-.4 1-1 1s-1-.4-1-1v-2.5c0-.8.5-1.5 1.2-1.8.1-.1.3-.3.3-.3v-.8s-.2-.2-.3-.3c-.7-.3-1.2-1-1.2-1.8V7c0-1.1-.9-2-2-2z" />
        <text x="12" y="14" textAnchor="middle" fontSize="6" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">JSON</text>
    </svg>
);

export const MarkdownIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M22.27 19.385H1.73A1.73 1.73 0 0 1 0 17.655V6.345a1.73 1.73 0 0 1 1.73-1.73h20.54A1.73 1.73 0 0 1 24 6.345v11.31a1.73 1.73 0 0 1-1.73 1.73zM18 10.5v3.185l3-3V7.5h-8v3l3 3V10.5h2zM6 7.5L3 10.5h2v6h2v-6h2L6 7.5z" />
    </svg>
);

export const SwiftIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M7.508 0c-.287 0-.573 0-.86.002-.241.002-.483.003-.724.01-.132.003-.263.009-.395.015A9.154 9.154 0 004.348.15 5.492 5.492 0 002.85.645 5.04 5.04 0 00.645 2.848c-.245.48-.4.972-.495 1.5-.093.52-.122 1.05-.136 1.576a35.2 35.2 0 00-.014.725C0 6.935 0 7.221 0 7.508v8.984c0 .287 0 .575.002.862.002.24.003.482.01.724.003.132.009.263.015.395.027.265.067.53.123.787.095.528.25 1.02.495 1.5a5.03 5.03 0 002.205 2.203c.48.245.972.4 1.5.495.52.093 1.05.122 1.576.136.242.007.483.008.724.01.287.002.573.002.86.002h8.984c.287 0 .573 0 .86-.002.241-.002.483-.003.724-.01.132-.003.263-.009.395-.015.265-.027.53-.067.787-.123a5.494 5.494 0 001.5-.495 5.04 5.04 0 002.203-2.203c.245-.48.4-.972.495-1.5.093-.52.122-1.05.136-1.576.007-.242.008-.483.01-.724.002-.287.002-.575.002-.862V7.508c0-.287 0-.573-.002-.86-.002-.241-.003-.483-.01-.724a12.01 12.01 0 00-.015-.395 5.494 5.494 0 00-.123-.787 5.03 5.03 0 00-.495-1.5 5.04 5.04 0 00-2.203-2.203 5.492 5.492 0 00-1.5-.495c-.52-.093-1.05-.122-1.576-.136a35.2 35.2 0 00-.724-.01A93.9 93.9 0 0016.492 0H7.508zm1.684 3.24c.03 0 .058.002.087.005 1.288.11 2.472.585 3.49 1.297 1.497.99 2.675 2.42 3.263 4.09.588 1.67.588 3.51 0 5.18-.588 1.67-1.766 3.1-3.263 4.09-1.018.712-2.202 1.187-3.49 1.297-.03.003-.058.005-.087.005H7.508c-.287 0-.573 0-.86-.002-.241-.002-.483-.003-.724-.01-.132-.003-.263-.009-.395-.015a9.154 9.154 0 01-1.18-.123 5.492 5.492 0 01-1.5-.495 5.04 5.04 0 01-2.203-2.203c-.245-.48-.4-.972-.495-1.5-.093-.52-.122-1.05-.136-1.576a35.2 35.2 0 01-.014-.724C0 13.467 0 13.181 0 12.894V11.106c0-.287 0-.573.002-.86.002-.241.003-.483.01-.724.003-.132.009-.263.015-.395.027-.265.067-.53.123-.787.095-.528.25-1.02.495-1.5a5.03 5.03 0 012.205-2.203c.48-.245.972-.4 1.5-.495.52-.093 1.05-.122 1.576-.136.242-.007.483-.008.724-.01.287-.002.573-.002.86-.002h1.684z" />
    </svg>
);

export const VueIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M19.114 3.4L12 16.4 4.886 3.4H0l12 20.8L24 3.4h-4.886zM12 14.4L16.886 6h-2.772L12 10.8 9.886 6H7.114L12 14.4z" />
    </svg>
);

export const SvelteIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M10.354 21.125a4.44 4.44 0 01-4.765-1.767 4.109 4.109 0 01-.703-3.107 3.898 3.898 0 01.134-.522l.105-.321.287.21a7.21 7.21 0 002.186 1.092l.208.063-.02.208a1.253 1.253 0 00.226.83 1.337 1.337 0 001.435.533 1.231 1.231 0 00.343-.15l5.59-3.562a1.164 1.164 0 00.524-.778 1.242 1.242 0 00-.211-.937 1.338 1.338 0 00-1.435-.533 1.23 1.23 0 00-.343.15l-2.133 1.36a4.078 4.078 0 01-1.135.499 4.44 4.44 0 01-4.765-1.766 4.108 4.108 0 01-.702-3.108 3.855 3.855 0 011.742-2.582l5.589-3.563a4.072 4.072 0 011.135-.499 4.44 4.44 0 014.765 1.767 4.109 4.109 0 01.703 3.107 3.943 3.943 0 01-.134.522l-.105.321-.286-.21a7.204 7.204 0 00-2.187-1.093l-.208-.063.02-.207a1.255 1.255 0 00-.226-.831 1.337 1.337 0 00-1.435-.532 1.231 1.231 0 00-.343.15L8.62 9.368a1.162 1.162 0 00-.524.778 1.24 1.24 0 00.211.937 1.338 1.338 0 001.435.533 1.235 1.235 0 00.344-.15l2.132-1.36a4.067 4.067 0 011.135-.499 4.44 4.44 0 014.765 1.767 4.109 4.109 0 01.703 3.107 3.857 3.857 0 01-1.742 2.583l-5.589 3.562a4.072 4.072 0 01-1.135.499z" />
    </svg>
);

export const DockerIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z" />
    </svg>
);

export const SQLIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1c-6.627 0-12 2.239-12 5v12c0 2.761 5.373 5 12 5s12-2.239 12-5V6c0-2.761-5.373-5-12-5zm0 2c5.523 0 10 1.791 10 3s-4.477 3-10 3S2 7.209 2 6s4.477-3 10-3zM2 9.5c1.657 1.308 5.233 2.5 10 2.5s8.343-1.192 10-2.5V12c0 1.209-4.477 3-10 3S2 13.209 2 12V9.5zm0 5c1.657 1.308 5.233 2.5 10 2.5s8.343-1.192 10-2.5V18c0 1.209-4.477 3-10 3S2 19.209 2 18v-3.5z" />
    </svg>
);

export const GitIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.6-.401-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187" />
    </svg>
);

export const XMLIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5 2L2 4.5v15L4.5 22h15l2.5-2.5v-15L19.5 2h-15zM7 7l3 5-3 5h2l2-3.5L13 17h2l-3-5 3-5h-2l-2 3.5L9 7H7z" />
        <text x="12" y="14" textAnchor="middle" fontSize="5" fontFamily="monospace" fontWeight="bold" fill="currentColor">XML</text>
    </svg>
);

export const YAMLIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2v20h16V2H4zm2 2h12v16H6V4zm2 2v2h2V6H8zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM8 10v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zM8 14v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z" />
    </svg>
);
