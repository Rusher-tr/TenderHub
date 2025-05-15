import { useContext } from 'react';
import TenderContext from './TenderContextDef';

export const useTenders = () => useContext(TenderContext);
