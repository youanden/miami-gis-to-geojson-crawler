#!/bin/bash

for zipfile in *.ZIP; do
    exdir="${zipfile%.ZIP}"
    mkdir "$exdir"
    unzip -d "$exdir" "$zipfile"
done

