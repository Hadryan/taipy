import React, { useState, useContext, useCallback, useEffect, useMemo } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

import { getUpdateVars, TaipyImage, TaipyInputProps } from "./utils";
import { TaipyContext } from "../../context/taipyContext";
import { createRequestUpdateAction, createSendUpdateAction } from "../../context/taipyReducers";

const boxSx = { width: "100%" };
const paperSx = { width: "100%", mb: 2 };

interface ItemProps {
    value: string;
    createClickHandler: (key: string) => () => void;
    selectedValue: string[];
    item: string | TaipyImage;
}

const SingleItem = ({ value, createClickHandler, selectedValue, item }: ItemProps) => (
    <ListItemButton onClick={createClickHandler(value)} selected={selectedValue.indexOf(value) !== -1}>
        {typeof item === "string" ? (
            <ListItemText primary={item} />
        ) : (
            <ListItemAvatar>
                <Avatar alt={(item as TaipyImage).text || value} src={(item as TaipyImage).path} />
            </ListItemAvatar>
        )}
    </ListItemButton>
);

const MultipleItem = ({ value, createClickHandler, selectedValue, item }: ItemProps) => (
    <ListItemButton onClick={createClickHandler(value)} dense>
        <ListItemIcon>
            <Checkbox edge="start" checked={selectedValue.indexOf(value) !== -1} tabIndex={-1} disableRipple />
        </ListItemIcon>
        {typeof item === "string" ? (
            <ListItemText primary={item} />
        ) : (
            <ListItemAvatar>
                <Avatar alt={(item as TaipyImage).text || value} src={(item as TaipyImage).path} />
            </ListItemAvatar>
        )}
    </ListItemButton>
);

interface LovItem {
    id: string;
    item: string | TaipyImage;
}

interface SelectorProps extends TaipyInputProps {
    defaultLov: string;
    filter: boolean;
    multiple: boolean;
    lov: [string, string | TaipyImage][];
}

const Selector = (props: SelectorProps) => {
    const {
        id,
        defaultValue,
        value,
        tp_varname,
        defaultLov,
        filter,
        multiple,
        className,
        propagate,
        lov,
        tp_updatevars = "",
    } = props;
    const [searchValue, setSearchValue] = useState("");
    const [selectedValue, setSelectedValue] = useState<string[]>([]);
    const { dispatch } = useContext(TaipyContext);

    useEffect(() => {
        dispatch(createRequestUpdateAction(id, [tp_varname, ...getUpdateVars(tp_updatevars)]));
    }, [tp_updatevars, dispatch, id, tp_varname]);

    const lovList: LovItem[] = useMemo(() => {
        if (lov) {
            if (lov.length && lov[0][0] === undefined) {
                console.debug("Selector tp_lov wrong format ", lov);
                return [];
            }
            return lov.map((elt) => ({ id: elt[0], item: elt[1] || elt[0] }));
        } else if (defaultLov) {
            let parsedLov;
            try {
                parsedLov = JSON.parse(defaultLov);
            } catch (e) {
                parsedLov = lov as unknown as string[];
            }
            return parsedLov.map((elt: [string, string | TaipyImage]) => ({ id: elt[0], item: elt[1] || elt[0] }));
        }
        return [];
    }, [defaultLov, lov]);

    useEffect(() => {
        if (value !== undefined) {
            setSelectedValue(Array.isArray(value) ? value : [value]);
        } else if (defaultValue) {
            let parsedValue;
            try {
                parsedValue = JSON.parse(defaultValue);
            } catch (e) {
                parsedValue = defaultValue;
            }
            setSelectedValue(Array.isArray(parsedValue) ? parsedValue : [parsedValue]);
        }
    }, [defaultValue, value]);

    const clickHandler = useCallback(
        (key: string) => {
            setSelectedValue((keys) => {
                if (multiple) {
                    const newKeys = [...keys];
                    const p = newKeys.indexOf(key);
                    if (p === -1) {
                        newKeys.push(key);
                    } else {
                        newKeys.splice(p, 1);
                    }
                    dispatch(createSendUpdateAction(tp_varname, newKeys, propagate));
                    return newKeys;
                } else {
                    dispatch(createSendUpdateAction(tp_varname, key, propagate));
                    return [key];
                }
            });
        },
        [tp_varname, dispatch, multiple, propagate]
    );

    const createClickHandler = useCallback((key: string) => () => clickHandler(key), [clickHandler]);

    const handleInput = useCallback((e) => {
        setSearchValue(e.target.value);
    }, []);

    return (
        <Box sx={boxSx} className={className}>
            <Paper sx={paperSx}>
                {filter && (
                    <TextField margin="dense" placeholder="Search field" value={searchValue} onChange={handleInput} />
                )}
                <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
                    {lovList
                        .filter(
                            (elt) =>
                                !filter ||
                                (
                                    (typeof elt.item === "string"
                                        ? (elt.item as string)
                                        : (elt.item as TaipyImage).text) || elt.id
                                )
                                    .toLowerCase()
                                    .indexOf(searchValue.toLowerCase()) > -1
                        )
                        .map((elt) =>
                            multiple ? (
                                <MultipleItem
                                    key={elt.id}
                                    value={elt.id}
                                    item={elt.item}
                                    selectedValue={selectedValue}
                                    createClickHandler={createClickHandler}
                                />
                            ) : (
                                <SingleItem
                                    key={elt.id}
                                    value={elt.id}
                                    item={elt.item}
                                    selectedValue={selectedValue}
                                    createClickHandler={createClickHandler}
                                />
                            )
                        )}
                </List>
            </Paper>
        </Box>
    );
};

export default Selector;
