-- v25.3: Barcha segment turlarini qo'shish
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_segment_check;
ALTER TABLE users ADD CONSTRAINT users_segment_check
    CHECK(segment IN('optom','chakana','oshxona','xozmak','kiyim','gosht','meva','qurilish','avto','dorixona','texnika','mebel','mato','gul','kosmetika','universal'));
