from enum import Enum


class DocumentType(str, Enum):
    urun = "urun"
    kargo = "kargo"
    iade = "iade"
    odeme = "odeme"
    garanti = "garanti"
    destek = "destek"
    genel = "genel"
