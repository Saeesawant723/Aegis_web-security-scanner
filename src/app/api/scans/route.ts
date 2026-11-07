import { NextRequest, NextResponse } from 'next/server';
import { getScans, getScanById, deleteScan } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const scan = await getScanById(id);
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }
    return NextResponse.json(scan);
  }

  const scans = await getScans();
  return NextResponse.json(scans);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
  }

  const success = await deleteScan(id);
  return NextResponse.json({ success });
}
