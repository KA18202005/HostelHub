from sqlmodel import Session, select

from app.db.database import engine
from app.models.hostel import Hostel
from app.models.room import Room


BOYS_HOSTEL_ID = "06e7544e-3ee3-442f-b0ad-53dac0f69d53"
GIRLS_HOSTEL_ID = "b3b5a6cf-b10a-4358-a1fd-a46820cca047"


# ---------------------------------------------------------
# Normal blocks
# ---------------------------------------------------------

BOYS_8_FLOOR_BLOCKS = [
    "D",
    "I",
    "J",
    "K",
    "L",
]

BOYS_3_FLOOR_BLOCKS = [
    "E",
]

GIRLS_8_FLOOR_BLOCKS = [
    "G",
]

GIRLS_3_FLOOR_BLOCKS = [
    "F",
]


# ---------------------------------------------------------
# Apartment structures
# ---------------------------------------------------------

P_APARTMENTS = {
    "A": 4,
    "B": 4,
    "C": 4,
    "D": 4,
    "E": 4,
    "F": 4,
    "G": 3,
    "H": 1,
}

Q_APARTMENTS = {
    "A": 3,
    "B": 4,
    "C": 4,
    "D": 4,
}


def normal_room_capacity(room_index: int) -> int:
    """
    Normal blocks:

    Rooms 1-6 -> 3 students
    Room 7    -> 4 students
    """
    if room_index == 7:
        return 4

    return 3


def room_exists(
    session: Session,
    hostel_id,
    block: str,
    room_number: str,
) -> bool:
    return session.exec(
        select(Room).where(
            Room.hostel_id == hostel_id,
            Room.block == block,
            Room.room_number == room_number,
        )
    ).first() is not None


def create_normal_block(
    session: Session,
    hostel_id,
    block: str,
    max_floor: int,
):
    """
    Creates:

    Ground:
        001-007

    Floor 1:
        101-107

    Floor 2:
        201-207

    ...

    Floor 8:
        801-807
    """

    print()
    print(f"===== BLOCK {block} =====")

    for floor in range(0, max_floor + 1):

        for room_index in range(1, 8):

            if floor == 0:
                room_number = f"00{room_index}"
            else:
                room_number = f"{floor}{room_index:02d}"

            if room_exists(
                session,
                hostel_id,
                block,
                room_number,
            ):
                print(
                    f"Already exists: "
                    f"{block}-{room_number}"
                )
                continue

            room = Room(
                block=block,
                room_number=room_number,
                floor=floor,
                capacity=normal_room_capacity(
                    room_index
                ),
                hostel_id=hostel_id,
                apartment=None,
            )

            session.add(room)

            print(
                f"Created: {block}-{room_number} "
                f"capacity={room.capacity}"
            )


def create_apartment_block(
    session: Session,
    hostel_id,
    block: str,
    apartments: dict[str, int],
    max_floor: int,
):
    """
    Creates apartment-style rooms on every floor.

    Example:

    Floor 1:

        A101 A102 A103 A104
        B101 B102 B103 B104

    Floor 2:

        A201 A202 A203 A204
        B201 B202 B203 B204
    """

    print()
    print(f"===== APARTMENT BLOCK {block} =====")

    for floor in range(1, max_floor + 1):

        for apartment, room_count in apartments.items():

            for room_index in range(1, room_count + 1):

                room_number = (
                    f"{apartment}"
                    f"{floor}{room_index:02d}"
                )

                if room_exists(
                    session,
                    hostel_id,
                    block,
                    room_number,
                ):
                    print(
                        f"Already exists: "
                        f"{block}-{room_number}"
                    )
                    continue

                room = Room(
                    block=block,
                    apartment=apartment,
                    room_number=room_number,
                    floor=floor,
                    capacity=1,
                    hostel_id=hostel_id,
                )

                session.add(room)

                print(
                    f"Created: {block}-{room_number} "
                    f"capacity=1"
                )


def create_q_block(
    session: Session,
    boys_hostel_id,
    girls_hostel_id,
):
    """
    Q:

    Floors 1-6 -> Girls
    Floors 7-8 -> Boys

    Q apartments:

        A -> 3 rooms
        B -> 4 rooms
        C -> 4 rooms
        D -> 4 rooms

    All rooms are single occupancy.

    Examples:

        Floor 1:
            A101 A102 A103
            B101 B102 B103 B104
            C101 C102 C103 C104
            D101 D102 D103 D104

        Floor 7:

            A701 A702 A703
            B701 B702 B703 B704
            ...
    """

    print()
    print("===== APARTMENT BLOCK Q =====")

    for floor in range(1, 9):

        if floor <= 6:
            hostel_id = girls_hostel_id
            gender = "GIRLS"
        else:
            hostel_id = boys_hostel_id
            gender = "BOYS"

        for apartment, room_count in Q_APARTMENTS.items():

            for room_index in range(1, room_count + 1):

                room_number = (
                    f"{apartment}"
                    f"{floor}{room_index:02d}"
                )

                if room_exists(
                    session,
                    hostel_id,
                    "Q",
                    room_number,
                ):
                    print(
                        f"Already exists: "
                        f"Q-{room_number}"
                    )
                    continue

                room = Room(
                    block="Q",
                    apartment=apartment,
                    room_number=room_number,
                    floor=floor,
                    capacity=1,
                    hostel_id=hostel_id,
                )

                session.add(room)

                print(
                    f"Created: Q-{room_number} "
                    f"{gender} capacity=1"
                )


def main():

    with Session(engine) as session:

        boys_hostel = session.get(
            Hostel,
            BOYS_HOSTEL_ID,
        )

        girls_hostel = session.get(
            Hostel,
            GIRLS_HOSTEL_ID,
        )

        if boys_hostel is None:
            raise ValueError(
                f"Boys hostel not found: "
                f"{BOYS_HOSTEL_ID}"
            )

        if girls_hostel is None:
            raise ValueError(
                f"Girls hostel not found: "
                f"{GIRLS_HOSTEL_ID}"
            )

        print()
        print("==============================")
        print("HOSTEL ROOM SEEDING")
        print("==============================")

        print(
            f"Boys hostel: "
            f"{boys_hostel.name}"
        )

        print(
            f"Girls hostel: "
            f"{girls_hostel.name}"
        )

        # =================================================
        # BOYS
        # =================================================

        # D, I, J, K, L
        # Ground + 8 floors

        for block in BOYS_8_FLOOR_BLOCKS:

            create_normal_block(
                session=session,
                hostel_id=boys_hostel.id,
                block=block,
                max_floor=8,
            )

        # E
        # Ground + 3 floors

        for block in BOYS_3_FLOOR_BLOCKS:

            create_normal_block(
                session=session,
                hostel_id=boys_hostel.id,
                block=block,
                max_floor=3,
            )

        # P
        # No ground floor
        # Floors 1-8
        # Apartment based
        # Single occupancy

        create_apartment_block(
            session=session,
            hostel_id=boys_hostel.id,
            block="P",
            apartments=P_APARTMENTS,
            max_floor=8,
        )

        # =================================================
        # GIRLS
        # =================================================

        # G
        # Ground + 8 floors

        for block in GIRLS_8_FLOOR_BLOCKS:

            create_normal_block(
                session=session,
                hostel_id=girls_hostel.id,
                block=block,
                max_floor=8,
            )

        # F
        # Ground + 3 floors

        for block in GIRLS_3_FLOOR_BLOCKS:

            create_normal_block(
                session=session,
                hostel_id=girls_hostel.id,
                block=block,
                max_floor=3,
            )

        # =================================================
        # Q
        #
        # Floors 1-6 = Girls
        # Floors 7-8 = Boys
        #
        # Apartment based
        # Single occupancy
        # =================================================

        create_q_block(
            session=session,
            boys_hostel_id=boys_hostel.id,
            girls_hostel_id=girls_hostel.id,
        )

        session.commit()

        print()
        print("==============================")
        print("ROOM SEEDING COMPLETED")
        print("==============================")


if __name__ == "__main__":
    main()