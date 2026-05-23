import { PrismaClient, Rol } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Tipos de ticket
  const copa = await prisma.tipoTicket.upsert({
    where: { nombre: 'COPA' },
    update: {},
    create: { nombre: 'COPA', color: '#F5C518' },
  });

  const cerveza = await prisma.tipoTicket.upsert({
    where: { nombre: 'CERVEZA_REFRESCO' },
    update: {},
    create: { nombre: 'CERVEZA_REFRESCO', color: '#D97706' },
  });

  // Usuarios admin (4 fijos)
  const admins = [
    { nombre: 'Admin1', pin: '1111' },
    { nombre: 'Admin2', pin: '2222' },
    { nombre: 'Admin3', pin: '3333' },
    { nombre: 'Admin4', pin: '4444' },
  ];

  for (const a of admins) {
    await prisma.usuario.upsert({
      where: { nombre: a.nombre },
      update: {},
      create: { nombre: a.nombre, pin: await hash(a.pin, 10), rol: Rol.ADMIN },
    });
  }

  // Usuarios taquilla (3 fijos)
  const taquillas = [
    { nombre: 'Taquilla1', pin: '0001' },
    { nombre: 'Taquilla2', pin: '0002' },
    { nombre: 'Taquilla3', pin: '0003' },
  ];

  for (const t of taquillas) {
    await prisma.usuario.upsert({
      where: { nombre: t.nombre },
      update: {},
      create: { nombre: t.nombre, pin: await hash(t.pin, 10), rol: Rol.TAQUILLA },
    });
  }

  // Productos de ejemplo
  const products = [
    { nombre: 'Copa Vino', precio: 2.0, tickets: [{ tipoTicketId: copa.id, cantidad: 1 }] },
    { nombre: 'Cerveza', precio: 2.0, tickets: [{ tipoTicketId: cerveza.id, cantidad: 1 }] },
    { nombre: 'Refresco', precio: 1.5, tickets: [{ tipoTicketId: cerveza.id, cantidad: 1 }] },
    { nombre: 'Pack 5 Copas', precio: 9.0, tickets: [{ tipoTicketId: copa.id, cantidad: 5 }] },
    {
      nombre: 'Pack Mixto',
      precio: 8.0,
      tickets: [
        { tipoTicketId: copa.id, cantidad: 3 },
        { tipoTicketId: cerveza.id, cantidad: 2 },
      ],
    },
  ];

  for (const p of products) {
    const producto = await prisma.producto.upsert({
      where: { nombre: p.nombre },
      update: {},
      create: { nombre: p.nombre, precio: p.precio },
    });

    for (const t of p.tickets) {
      await prisma.productoTicket.upsert({
        where: { productoId_tipoTicketId: { productoId: producto.id, tipoTicketId: t.tipoTicketId } },
        update: { cantidad: t.cantidad },
        create: { productoId: producto.id, tipoTicketId: t.tipoTicketId, cantidad: t.cantidad },
      });
    }
  }

  console.log('Seed completado');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
